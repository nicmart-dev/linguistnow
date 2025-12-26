# Overview

The app was styled using **Tailwind CSS v4**, a utility-first framework with a comprehensive [documentation](https://tailwindcss.com/docs/installation) that reduces time to create CSS. The application has been upgraded from Tailwind CSS v3 to v4, and migrated from Create React App to Vite for improved performance and developer experience.


<details>
  <summary>Why using Tailwind CSS?</summary>

Using Tailwind CSS for a web development capstone project can offer several advantages, particularly if you're looking to create a modern, responsive, and visually appealing user interface. Here are some compelling reasons to consider Tailwind CSS for your project:
1. Utility-First Framework: Tailwind CSS is a utility-first framework, meaning it provides low-level utility classes to build custom designs without leaving your HTML. This approach can be more efficient than using traditional CSS frameworks, where you often have to override existing styles.
2. Customizability: Tailwind allows you to customize every aspect of your design system. You can easily configure colors, spacing, fonts, and more to match the specific requirements of your project. This is particularly useful in a capstone project where you might want to showcase unique and personalized designs.
3. Responsive Design: Tailwind includes responsive design classes out of the box, making it straightforward to create layouts that work well on different screen sizes. This ensures that your project will be accessible and usable on various devices.
4. Consistency: Using utility classes ensures a consistent application of styles throughout your project. This consistency can help maintain a clean and cohesive look, which is crucial for a professional presentation in a capstone project.
5. Speed and Efficiency: Tailwind CSS can speed up the development process. Instead of writing custom CSS, you can quickly apply classes to HTML elements. This can be particularly beneficial in a capstone project where time is limited, and you need to focus on functionality as well as design.
6. Performance: Tailwind CSS is designed to be highly performant. The framework encourages a minimal approach to styling, and its built-in PurgeCSS functionality removes unused CSS, reducing the final bundle size.
7. Community and Ecosystem: Tailwind CSS has a large and active community, which means you can find plenty of resources, tutorials, and plugins to help you with your project. This community support can be invaluable, especially if you encounter issues or need inspiration.
8. Integration with Modern Tools: Tailwind CSS integrates well with modern JavaScript frameworks and build tools like React, Vue, Angular, and Next.js. This makes it easier to incorporate into a variety of tech stacks you might be using for your capstone project.
9. Best Practices: By using Tailwind CSS, you can learn and adhere to modern best practices in CSS design and architecture. This experience can be beneficial for your future career as it reflects current trends in front-end development.
Documentation: Tailwind CSS has comprehensive and well-organized documentation. This makes it easier to learn and implement, ensuring that you can effectively use its features in your project.

</details>

# Resources & assets

## Icons

All of the icons come from [Heroicons](https://heroicons.com/), which is a free MIT-licensed icon set we designed and developed ourselves when we started working on Tailwind UI.

## Images

Images come almost exclusively from [Unsplash](https://unsplash.com/). It's a great resource if you need freely-usable photography for your projects.

## Components

The app is using the below components, to speed development process and get a polished look and feel.

### Navbar
* Header, using Nordic store minimal design starter template https://github.com/tailwindtoolbox/Nordic-Store

  <img alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/d854fd22-457a-4486-bf3c-bfd823bb7e78">

### Hero component

* Hero with Background Image - Tailwind Component: https://kopi.dev/tailwind/hero-with-background-image/

  <img width="465" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/9c03a0b0-de07-4b7f-921f-c38cd28695c3">

### Settings

*  HyperUI Checkboxes grouped with highlight component: https://www.hyperui.dev/components/application-ui/checkboxes#component-6

  <img width="157" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/961ab0e0-fa8b-4e10-8348-b9749e5195d1">


### Dashboard page

* Responsive table: implemented using [shadcn/ui DataTable](https://ui.shadcn.com/docs/components/data-table) built on [TanStack Table](https://tanstack.com/table), with [Button](https://ui.shadcn.com/docs/components/button) and [Input](https://ui.shadcn.com/docs/components/input) components.

  <img width="494" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/1586572f-545a-4b22-8a9a-7fb7f1b0a286">

  **Component Architecture:**
  - Built with shadcn/ui for consistent, accessible components
  - Uses compound component pattern for flexibility
  - Fully typed with TypeScript support
  - Features: sorting, filtering, pagination, column visibility

  Note: At first used https://datatables.net/ but decided against it as not compatible with React.

## Component-Based Design

### shadcn/ui Integration

The application uses [shadcn/ui](https://ui.shadcn.com/), a collection of re-usable components built with Radix UI and Tailwind CSS.

**Installed Components:**
- `Button` - Variant-based button component
- `Input` - Form input with consistent styling
- `Table` - Table primitives (TableHeader, TableBody, TableRow, etc.)
- `DataTable` - Full-featured data table wrapper

**Location:** `client/src/components/`

**Benefits:**
- ✅ Copy-paste components (not a dependency)
- ✅ Fully customizable
- ✅ Accessible by default (Radix UI)
- ✅ Consistent design system
- ✅ Type-safe with TypeScript

### Component Reusability

All UI components follow DRY principles:

1. **Shared Utilities** - `cn()` function for class merging (`lib/utils.js`)
2. **Consistent Patterns** - Same component structure throughout
3. **Composable Design** - Small components that combine into larger ones
4. **Path Aliases** - Clean imports via Vite aliases

### Tailwind CSS v4 Changes

**Migration from v3 to v4:**
- Uses `@tailwindcss/postcss` plugin
- CSS-first configuration
- Improved performance
- Better tree-shaking

**Configuration:**
- `tailwind.config.js` - Theme customization
- `postcss.config.js` - PostCSS configuration
- `src/tailwind.css` - Main stylesheet with `@import` directives


### Footer

* Footer from Nordic store minimal design starter template https://github.com/tailwindtoolbox/Nordic-Store

  <img width="508" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/7c6aedd9-7ffb-42d7-a2cd-2f81c897b585">


### Global 

* Skeleton loading: https://flowbite.com/docs/components/skeleton/
  
  ![chrome-capture-2024-6-9](https://github.com/nicmart-dev/linguistnow/assets/10499747/04885b87-fc0d-401b-b8a5-0aeed3d67bb2)


