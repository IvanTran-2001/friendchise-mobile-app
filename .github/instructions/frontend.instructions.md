# Frontend Instructions

Use these rules for UI, layout, styling, and frontend component work in this Expo mobile app.

## Design Direction

- Match the existing FriendChise mobile visual language: calm, refined, and functional.
- Prefer clean surfaces, subtle borders, restrained shadows, and comfortable tap targets.
- Keep interfaces intentional and readable on small screens first.
- Avoid desktop-first layout assumptions unless the screen explicitly supports web as well.

## Component Choices

- Prefer existing shared UI components before creating custom ones.
- If the current building blocks are close but not quite enough, extend the shared component instead of cloning it into a one-off variant.
- If a new component is necessary, design it as a reusable shared building block with a clear API so other screens can use it later.
- Reuse the mobile design tokens in `src/lib/theme.ts` instead of hardcoding colors, spacing, or radius values.
- Keep buttons, sheets, action rows, and list items consistent with the shared components in `components/ui`.
- Keep compact icon buttons at the repo-standard tap target sizes.

## Layout Rules

- Protect mobile layouts from overflow, clipped content, and cramped text.
- Preserve safe-area aware spacing near the top, bottom, and system UI overlays.
- Avoid introducing unnecessary nested scroll containers.
- Prefer local layout fixes over global styling changes.
- Keep responsive behavior sensible for both phone sizes and web preview when the screen supports it.

## Interaction Rules

- Make primary actions obvious and secondary actions quieter.
- Do not hide important actions behind hover-only behavior.
- Use loading, empty, and error states that are specific to the feature.
- Keep destructive actions explicit.
- Favor touch-friendly controls over tiny tap targets or dense gesture-only affordances.

## Accessibility

- Every icon-only button needs a clear accessible label.
- Interactive elements should use the correct semantic control for React Native and have the right press behavior.
- Do not rely on color alone to communicate state.
- Make sure sheets, menus, and modal surfaces remain accessible from touch and keyboard input where supported.

## Styling Guidelines

- Reuse existing theme tokens and component patterns.
- Prefer small, targeted styling changes over broad visual rewrites.
- Keep spacing, radius, and typography aligned with nearby components.
- If a screen already has an established tone, follow it rather than rebranding it.

## Examples

Good:

```tsx
<IconButton aria-label="Delete draft" variant="ghost" size="sm">
	<Trash2 size={16} />
</IconButton>
```

Bad:

```tsx
<Pressable style={{ height: 24, width: 24, borderRadius: 4, backgroundColor: "#8b5cf6" }}>
	<Trash2 />
</Pressable>
```

Good:

```tsx
<View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 }}>
	<Text numberOfLines={1}>Long title text</Text>
</View>
```

Bad:

```tsx
<View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
	<Text>Long title text</Text>
</View>
```

Good:

```tsx
<SheetModal visible={open} onClose={onClose}>
	<Button variant="destructive" onPress={handleDelete}>
		Delete
	</Button>
</SheetModal>
```

Bad:

```tsx
if (confirm("Delete this item?")) {
	deleteItem();
}
```
