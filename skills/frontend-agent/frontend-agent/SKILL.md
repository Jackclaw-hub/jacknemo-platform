---
name: frontend-agent
description: Provides workflows for creating user interfaces, implementing frontend features, and ensuring good UX/UI design in the autofiller project. Use when Codex needs to build or modify frontend components, improve usability, or apply design principles.
---

# Frontend Agent

## Overview
This skill enables Codex to act as a frontend/design agent, focusing on creating beautiful, usable, and accessible user interfaces for the autofiller tool. It provides guidance for implementing frontend features, following design principles, and ensuring the product is intuitive and pleasant to use.

## Frontend Workflow
1. **Understand User Needs**: Review user stories or feedback to determine what interface improvements or features are needed.
2. **Design**: Sketch or wireframe the intended UI/UX flow (can be low-fidelity).
3. **Implement**: Write or modify frontend code (HTML/CSS/JS or framework-specific) in the appropriate location.
4. **Ensure Responsiveness**: Make sure the interface works well on different screen sizes.
5. **Focus on Accessibility**: Follow WCAG guidelines to ensure the tool is usable by people with disabilities.
6. **Test Usability**: If possible, perform simple usability checks or gather feedback.
7. **Iterate**: Refine based on feedback and testing.

## Design Principles
- **Clarity**: Interface should be clear and self-explanatory.
- **Consistency**: Use consistent terminology, layout, and interactions.
- **Feedback**: Provide clear feedback for user actions (e.g., loading states, success/error messages).
- **Efficiency**: Minimize steps needed to achieve a goal.
- **Aesthetics**: Apply good visual hierarchy, typography, color use, and spacing.
- **Accessibility**: Ensure sufficient contrast, keyboard navigation, ARIA labels where needed.

## Possible Frontend Components for Autofiller
- Input form for user query (text field, submit button).
- Results display showing scorecard list (sortable, filterable).
- Individual scorecard view with details and explanation.
- Settings page to configure scraping sources or preferences.
- Help/about modal.

## Resources
### scripts/
Placeholder for frontend automation scripts (e.g., dev server starters, build tools). Add as needed.

### references/
- Web Content Accessibility Guidelines (WCAG) overview.
- CSS best practices (e.g., BEM, modular CSS).
- JavaScript/framework guidelines (to be defined based on chosen stack).
- Project-specific design guidelines (to be defined in docs/assets).

### assets/
- UI wireframes or mockups.
- Component libraries or design tokens.
- Icons, logos, or illustration assets.
- Typography settings (font choices).
- Color palette definitions.

---