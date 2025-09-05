# Skeleton Component Usage Guide

This guide covers the standardized Skeleton component usage patterns in the Time Tracker application.

## Base Skeleton Component

The base `Skeleton` component is located at `components/ui/skeleton.tsx` and follows shadcn/ui patterns:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Basic usage
<Skeleton className="h-4 w-32" />
```

## Component Classes

The skeleton uses these default classes:
- `bg-accent` - Background color matching the app theme
- `animate-pulse` - Provides the loading animation
- `rounded-md` - Default border radius

## Usage Patterns

### 1. User Avatar & Profile Loading

For user authentication states (Clerk loading):

```tsx
// NavUser.tsx pattern
if (!isLoaded) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 p-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

### 2. Navigation Menu Loading

For async navigation items:

```tsx
// nav-main.tsx pattern
{isLoading && (
  <SidebarMenuItem>
    <SidebarMenuSkeleton showIcon />
  </SidebarMenuItem>
)}
```

### 3. Table Data Loading

For table/grid data loading states:

```tsx
// AdminJobsTable.tsx pattern
<div className="space-y-3">
  {[...Array(6)].map((_, i) => (
    <div key={i} className="grid grid-cols-8 gap-3">
      {[...Array(8)].map((__, j) => (
        <Skeleton key={j} className="h-6 w-full" />
      ))}
    </div>
  ))}
</div>
```

## Specialized Skeleton Components

### SidebarMenuSkeleton

Located in `components/ui/sidebar.tsx`, this component provides consistent loading for sidebar menu items:

```tsx
import { SidebarMenuSkeleton } from "@/components/ui/sidebar";

// With icon
<SidebarMenuSkeleton showIcon />

// Text only  
<SidebarMenuSkeleton />
```

**Features:**
- Random width between 50-90% for natural loading appearance
- Optional icon skeleton
- Consistent spacing with actual menu items

## Size Guidelines

### Common Skeleton Sizes

- **Avatar/Profile Image**: `h-8 w-8 rounded-lg`
- **User Name**: `h-4 w-28`
- **Email/Secondary Text**: `h-3 w-40`
- **Menu Item**: Use `SidebarMenuSkeleton`
- **Table Cell**: `h-6 w-full`
- **Button**: `h-9 w-20` (or match actual button dimensions)

### Responsive Considerations

- Use consistent spacing that matches your actual components
- Consider mobile vs desktop proportions
- Test skeleton layouts on different screen sizes

## Implementation Checklist

When adding skeleton loading to a new component:

- [ ] **Import the base Skeleton component**
- [ ] **Match skeleton dimensions to actual content**
- [ ] **Use consistent spacing and gap classes**
- [ ] **Consider rounded corners that match your design**
- [ ] **Test loading state duration (avoid flash of content)**
- [ ] **Ensure accessibility (aria-label="Loading...")**

## Best Practices

### 1. Dimension Matching
Always match skeleton dimensions to the actual content:

```tsx
// ✅ Good - matches actual button
<Skeleton className="h-9 w-24" /> // For a button

// ❌ Bad - doesn't match content size
<Skeleton className="h-4 w-10" /> // For a button
```

### 2. Loading State Duration
Avoid skeleton flash by setting minimum loading duration:

```tsx
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    const [data] = await Promise.all([
      fetchMyData(),
      new Promise(resolve => setTimeout(resolve, 300)) // Min 300ms
    ]);
    setIsLoading(false);
  };
}, []);
```

### 3. Accessibility
Add proper accessibility attributes:

```tsx
<div aria-label="Loading content">
  <Skeleton className="h-4 w-32" />
</div>
```

## Extending to New Components

### Hook Pattern for Async Data

For hooks that fetch data asynchronously:

```tsx
// useMyData.ts
export function useMyData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading };
}

// Component.tsx
function MyComponent() {
  const { data, isLoading } = useMyData();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return <div>{/* actual content */}</div>;
}
```

### Component Loading States

For components with async operations:

```tsx
function AsyncComponent() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* actual content */}
    </Card>
  );
}
```

## Consistency Notes

- Always use the base `Skeleton` component from `components/ui/skeleton.tsx`
- Prefer specialized components like `SidebarMenuSkeleton` when available
- Keep skeleton layouts visually similar to actual content
- Use consistent spacing and sizing patterns across the app
- Test skeleton states during development to ensure good UX

## Migration Guide

When migrating existing loading states:

1. **Identify custom loading implementations** (spinners, custom pulse animations)
2. **Replace with standardized Skeleton components**
3. **Match dimensions and spacing** to existing content
4. **Test the loading transition** for smoothness
5. **Update any related TypeScript types** if needed

This standardization ensures consistent loading experiences across the entire application.