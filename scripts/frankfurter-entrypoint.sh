#!/usr/bin/env sh
set -e

# =============================================================================
# Frankfurter Lightweight Entrypoint
# =============================================================================
# Prevents excessive CPU load and memory usage by:
# 1. Pruning all ~100 non-ECB provider seeds (eliminating unneeded national banks)
# 2. Restricting ECB coverage_start to a rolling retention window (default 90 days)
#    instead of backfilling 27+ years of history (1999 to present)
# 3. Transparently routing legacy /latest requests to /v1/latest in Rack
# 4. Pruning rates older than the retention window on startup and daily at 01:00 UTC
# =============================================================================

RETENTION_DAYS="${FRANKFURTER_RETENTION_DAYS:-${RETENTION_DAYS:-90}}"
export RETENTION_DAYS

mkdir -p /app/data
chmod 777 /app/data

bundle exec ruby -e '
  retention_days = Integer(ENV.fetch("RETENTION_DAYS", 90))
  providers_dir = "/app/db/seeds/providers"

  # 1. Remove all providers except ECB
  if Dir.exist?(providers_dir)
    Dir.glob("#{providers_dir}/*.json").each do |file|
      File.delete(file) unless File.basename(file) == "ecb.json"
    end

    # 2. Limit ECB coverage to recent rates (default 90 days)
    ecb_file = "#{providers_dir}/ecb.json"
    if File.exist?(ecb_file)
      require "json"
      require "date"
      data = JSON.parse(File.read(ecb_file))
      data["coverage_start"] = (Date.today - retention_days).to_s
      File.write(ecb_file, JSON.pretty_generate(data))
    end
  end

  # 3. Add legacy URL rewriting in config.ru (/latest -> /v1/latest)
  config_ru = "/app/config.ru"
  if File.exist?(config_ru)
    content = File.read(config_ru)
    unless content.include?("LegacyRewrite")
      middleware = %q{
class LegacyRewrite
  def initialize(app)
    @app = app
  end
  def call(env)
    path = env["PATH_INFO"]
    if path == "/latest" || path =~ %r{\A/\d{4}-\d{2}-\d{2}} || path == "/currencies"
      env["PATH_INFO"] = "/v1" + path
    end
    @app.call(env)
  end
end
use LegacyRewrite
}
      new_content = content.sub("run App.freeze.app", middleware + "\nrun App.freeze.app")
      File.write(config_ru, new_content)
    end
  end

  # 4. Schedule daily rate pruning at 01:00 UTC in bin/schedule
  schedule_file = "/app/bin/schedule"
  if File.exist?(schedule_file)
    content = File.read(schedule_file)
    unless content.include?("rates_prune")
      prune_job = %q{
unless dry_run
  scheduler.cron("0 1 * * *") do # rates_prune
    cutoff = (Date.today - Integer(ENV.fetch("RETENTION_DAYS", 90))).to_s
    if DB.table_exists?(:rates)
      deleted = DB[:rates].where { date < cutoff }.delete
      Log.info("Pruned #{deleted} rates older than #{cutoff}") if deleted.positive?
    end
  end
end
}
      new_content = content.sub("scheduler.join unless dry_run", prune_job + "\nscheduler.join unless dry_run")
      File.write(schedule_file, new_content)
    end
  end
'

# 5. Migrate and seed ECB
bundle exec rake db:setup
chmod 666 /app/data/frankfurter.sqlite3* 2>/dev/null || true

# 6. Prune any rates older than retention window on startup
bundle exec ruby -e '
  require_relative "boot"
  require "db"
  require "date"
  cutoff = (Date.today - Integer(ENV.fetch("RETENTION_DAYS", 90))).to_s
  if DB.table_exists?(:rates)
    deleted = DB[:rates].where { date < cutoff }.delete
    puts "Pruned #{deleted} historical rates older than #{cutoff}" if deleted.positive?
  end
'

# 7. Start foreman (puma + scheduler)
exec bundle exec foreman start
