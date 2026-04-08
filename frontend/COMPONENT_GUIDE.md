# Cortex AI Frontend - Component Guide

## Component Hierarchy

```
App
├── Sidebar (Navigation)
│   ├── Logo
│   └── Nav Items (Chat, Pipelines, Templates, Dashboard)
├── Top Bar
│   ├── Page Title
│   └── Model Selector (Chat only)
├── Main Content (Router)
│   ├── ChatView
│   │   ├── ConversationList
│   │   └── Chat Area
│   │       ├── Message List
│   │       │   └── ChatMessage (repeating)
│   │       └── Input Area
│   ├── PipelineView
│   │   ├── Pipeline List
│   │   └── Pipeline Detail
│   │       └── PipelineBuilder (create mode)
│   ├── TemplatesView
│   │   ├── Template Grid
│   │   │   └── Template Cards
│   │   ├── TemplateBuilder (create mode)
│   │   └── TemplateModal (execute mode)
│   └── DashboardView
│       ├── Stat Cards
│       ├── Token Chart
│       ├── Models List
│       └── Usage Table
└── Connection Banner (error state)
```

## Component Details

### App.tsx
**Purpose**: Root component, manages routing and global state

**State**:
- `currentView`: Which page is displayed (chat|pipelines|templates|dashboard)
- `selectedModel`: Active AI model name
- `selectedProvider`: Active provider (ollama, etc)

**Props Passed**:
- `selectedModel` and `selectedProvider` to ChatView
- Routes content based on `currentView`

**Features**:
- Left sidebar with navigation
- Top bar with page title and model selector
- Health status indicator (green/red dot)
- Connection lost banner overlay

---

### Chat Components

#### ChatView.tsx
**Purpose**: Main chat interface with conversations management

**State**:
- `conversations`: Array of conversation objects
- `currentConversation`: Currently active conversation
- `messages`: Messages in current conversation
- `inputValue`: User input textarea content
- `isLoading`: Whether awaiting response

**Props**:
- `selectedModel`: string
- `selectedProvider`: string

**Features**:
- Load/create/delete conversations
- Auto-scroll on new messages
- Suggested prompts for empty chats
- Real-time streaming with animated dots
- Error handling with dismissible banner
- Textarea auto-resize

**Key Methods**:
- `handleNewChat()`: Create new conversation
- `handleSelectConversation(id)`: Load existing conversation
- `handleDeleteConversation(id)`: Delete and cleanup
- `handleSendMessage()`: Stream response via SSE
- `handleKeyDown()`: Handle Enter/Shift+Enter

---

#### ChatMessage.tsx
**Purpose**: Render individual messages with markdown

**Props**:
- `message`: Message object with content, role, model, provider

**Features**:
- User messages (cyan background, right-aligned)
- Assistant messages (card style, left-aligned)
- Markdown rendering with react-markdown
- Code block syntax highlighting via Prism
- Custom markdown component styling
- Links open in new tabs
- Tables, blockquotes, lists supported

---

#### ConversationList.tsx
**Purpose**: Sidebar showing conversation history

**Props**:
- `conversations`: Conversation[]
- `selectedId`: Currently selected conversation ID
- `onSelect`: Callback to load conversation
- `onDelete`: Callback to delete conversation
- `onNewChat`: Callback to create new chat
- `loading`: Loading state

**Features**:
- New Chat button with green accent
- Conversation items with title and timestamp
- Delete button appears on hover
- Loading skeleton state
- Empty state message
- Scrollable overflow

---

### Pipeline Components

#### PipelineView.tsx
**Purpose**: List pipelines and execute them

**State**:
- `pipelines`: Array of pipeline objects
- `selectedPipeline`: Currently selected pipeline
- `isCreating`: Show builder instead of list
- `isRunning`: Execution in progress
- `pipelineInput`: Input for pipeline execution
- `pipelineResults`: Results from each step

**Features**:
- Pipeline list on left sidebar
- Pipeline detail on right
- Step-by-step display with numbered circles
- System prompt and input template display
- Output results per step
- Create/run pipelines
- Error handling

**Delegates to**:
- `PipelineBuilder`: When creating new pipeline

---

#### PipelineBuilder.tsx
**Purpose**: UI to create new pipelines

**State**:
- `name`: Pipeline name
- `description`: What pipeline does
- `steps`: Array of pipeline steps
- `errors`: Validation errors

**Features**:
- Add/remove steps dynamically
- Model selector per step
- System prompt textarea
- Input template for step chaining
- Validation on save
- Cancel to go back

**Step Structure**:
```typescript
{
  name: string
  model: string
  provider: string
  systemPrompt: string
  inputTemplate: string
}
```

---

### Template Components

#### TemplatesView.tsx
**Purpose**: Grid of template cards with management

**State**:
- `templates`: Array of template objects
- `selectedTemplate`: For modal execution
- `showModal`: Modal visibility
- `isCreating`: Show builder instead of grid
- `loading`: Initial load state

**Features**:
- Grid layout (1-3 columns responsive)
- Category badges on cards
- Inline Use/Delete buttons
- Hover effects reveal actions
- Create new template button
- Loading skeleton
- Empty state

**Delegates to**:
- `TemplateBuilder`: Create mode
- `TemplateModal`: Execute mode

---

#### TemplateBuilder.tsx
**Purpose**: Create new templates with variables

**State**:
- `name`: Template name
- `description`: Description
- `category`: Category from dropdown
- `content`: Template prompt text
- `variables`: Array of variable names
- `newVariable`: Input for adding variables
- `model`: Suggested model
- `errors`: Validation errors

**Features**:
- Template content textarea with {variable} syntax
- Add/remove variables dynamically
- Preview showing [variable] replacements
- Category dropdown
- Model suggestion selector
- Validation (name + content required)

**Categories**:
- Code Generation
- Documentation
- Testing
- Code Review
- Debugging
- Optimization
- Refactoring
- Other

---

#### TemplateModal.tsx
**Purpose**: Execute templates with variable values

**Props**:
- `template`: Template to execute
- `models`: Available models
- `onClose`: Close modal callback
- `onRunTemplate`: API function to execute

**State**:
- `selectedModel`: Model to use
- `variables`: User-entered variable values
- `result`: Template execution result
- `isLoading`: Execution in progress
- `error`: Execution error

**Features**:
- Model selector dropdown
- Variable input fields per template variable
- Result display (streaming)
- Error display
- Disabled run button until all vars filled
- Close button

---

### Dashboard Components

#### DashboardView.tsx
**Purpose**: Main dashboard page with analytics

**State**:
- `usage`: Usage statistics
- `models`: Available models list
- `loading`: Initial load state
- `error`: Load error

**Features**:
- Loads usage and models on mount
- Displays 4 stat cards
- Token chart
- Models info section
- Recent activity table
- Loading skeletons

**Delegates to**:
- `StatCard`: For each statistic
- `TokenChart`: Token distribution
- `UsageTable`: Recent requests

---

#### StatCard.tsx
**Purpose**: Reusable statistics display card

**Props**:
- `label`: Card title
- `value`: Main value to display
- `icon`: Emoji icon
- `trend`: Subtitle/trend info

**Features**:
- Icon in top right
- Large value display
- Trend/subtitle text
- Hover border animation
- Fixed height container

---

#### TokenChart.tsx
**Purpose**: SVG bar chart of tokens per model

**Props**:
- `data`: Record<modelName, tokenCount>

**Features**:
- Responsive bar chart
- Color-coded bars (cyan, green, purple, etc)
- Tooltip with token counts
- Total and average calculations
- Dynamic max value scaling
- Smooth animations

---

#### UsageTable.tsx
**Purpose**: Table of recent API requests

**Features**:
- Timestamp column
- Model and provider columns
- Input/output token counts
- Total tokens (cyan highlight)
- Latency display
- Hover row highlight
- Sample data generation

**Columns**:
- Time (formatted)
- Model/Provider
- Input tokens (right-aligned)
- Output tokens (right-aligned)
- Total tokens (cyan accent)
- Latency

---

## Hooks

### useModels.ts
**Purpose**: Fetch and cache available models

**Returns**:
```typescript
{
  models: Model[]
  loading: boolean
  error: string | null
}
```

**Behavior**:
- Fetches on mount via `getModels()`
- Caches result in state
- Handles errors gracefully
- No refetching (use dependency array)

---

### useHealth.ts
**Purpose**: Poll backend health every 30 seconds

**Returns**:
```typescript
{
  isHealthy: boolean
}
```

**Behavior**:
- Checks health on mount
- Sets 30-second poll interval
- Updates `isHealthy` state
- Cleanup on unmount
- Used in App to show connection banner

---

## Styling Patterns

### Color Usage
```css
/* Cyan accent - primary action */
.bg-cortex-cyan text-black

/* Green accent - secondary action */
.bg-cortex-green text-black

/* Purple accent - tertiary action */
.bg-cortex-purple text-white

/* Card backgrounds */
.bg-cortex-card

/* Borders */
.border-cortex-border

/* Full screen background */
.bg-cortex-bg
```

### Hover States
```css
/* Bright button hover */
.hover:brightness-110

/* Border color change */
.hover:border-cortex-cyan

/* Background opacity change */
.hover:bg-cortex-border hover:bg-opacity-50

/* Smooth transitions */
button, [role="button"] { transition: all 200ms ease-in-out; }
```

### Layout Patterns
```css
/* Sidebar + Content */
.flex gap-6
  .w-64 (sidebar)
  .flex-1 (content)

/* Grid for templates/dashboard */
.grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

/* Modal overlay */
.fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
```

### Loading States
```css
/* Skeleton pulse */
.bg-cortex-border bg-opacity-50 .animate-pulse

/* Animated dots */
.animate-bounce (with animation-delay per dot)

/* Loading text */
"Loading..." or "Sending..." states
```

## Type System

All API types are defined in `src/lib/api.ts`:

```typescript
export interface Model {
  name: string
  provider: string
  size?: string
  parameters?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  model?: string
  provider?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables: string[]
  model?: string
  provider?: string
}

export interface Pipeline {
  id: string
  name: string
  description: string
  steps: PipelineStep[]
  createdAt: string
}

export interface PipelineStep {
  id: string
  name: string
  model: string
  provider: string
  systemPrompt: string
  inputTemplate: string
}

export interface Usage {
  totalRequests: number
  totalTokens: number
  modelsUsed: string[]
  uptime: number
}
```

## Event Handling Patterns

### Form Submission
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}
```

### Click with Stoppage
```typescript
<button onClick={(e) => {
  e.stopPropagation()
  onDelete(id)
}}>
  Delete
</button>
```

### Async Loading
```typescript
const handleClick = async () => {
  setIsLoading(true)
  try {
    const result = await apiCall()
    setData(result)
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}
```

## Performance Considerations

1. **Component Memoization**: Not used by default (unnecessary for this app size)
2. **Key Props**: Unique keys on all list items
3. **Dependency Arrays**: Properly scoped useEffect dependencies
4. **Event Delegation**: Used for list item actions
5. **CSS Animations**: Hardware-accelerated (transform, opacity)
6. **Image Optimization**: No images, using text/emojis
7. **Code Splitting**: Potential via route-based splitting (future)

## Accessibility

- Semantic HTML (button, section, main, etc)
- ARIA labels where needed
- Color contrast ratios meet standards
- Keyboard navigation support
- Focus indicators on interactive elements
- Error messages associated with inputs
