/* 
Function to get browser language to support automatically setting language at initial load.

Testing changing the browser language involves adjusting the settings of your browser. Here's how you can do it in different browsers:
Google Chrome

Open Chrome and go to a new tab.
Open Developer Tools by pressing Ctrl + Shift + I (Windows/Linux) or Cmd + Option + I (Mac).
In the DevTools window, click on the three vertical dots (⋮) in the top-right corner.
Go to "More tools" > "Sensors".
Under "Geolocation", select the desired language from the dropdown menu.
*/

export type Locale = "en" | "fr" | "zh-cn";

export const getLocale = (): Locale => {
    // Check navigator language
    const language = navigator.language.split(/[-_]/)[0]; // Extract language code only
    return (["en", "fr", "zh-cn"].includes(language) ? language : "en") as Locale;
};
