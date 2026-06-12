The current homepage and components are too generic, and lack the visual impact and "premium" feel requested. I will implement a modern, high-conversion UI with distinct sections, subtle gradients, textures, and micro-animations.

### Visual Improvements

*   **Header:** Fixed logo styling, consistent spacing, and a "square" fixed logo as requested.
*   **Hero Section:** High-impact banner with a sophisticated gradient overlay, better typography (Outfit font), and a floating effect.
*   **Backgrounds:** Use a mix of subtle textures (cubes, paper) and soft gradients (primary to transparent) for each section to create depth and separation.
*   **Footer:** Differentiate from the rest of the page with a deeper, more elegant color palette and improved layout.
*   **Animations:** Staggered entry animations and smooth hover transitions on all interactive elements.

### Technical Details

*   **Tailwind CSS:** Leverage modern Tailwind 4 features (as seen in `src/styles.css`) for utility-based styling and custom animations.
*   **Lucide Icons:** Use consistent iconography for features.
*   **Responsive Design:** Ensure the layout is perfectly balanced on both desktop and mobile.

### Components to Update

1.  **`src/components/Header.tsx`**: Update layout, add a dedicated logo container, and refine navigation.
2.  **`src/components/Footer.tsx`**: Completely redesign with better contrast and spacing.
3.  **`src/routes/index.tsx`**: Rebuild the sections with specific background styles, improved typography, and better content flow.
4.  **`src/styles.css`**: Add keyframe animations and global utility classes for the new design.
