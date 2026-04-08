# Cortex AI - Frontend

A premium dark-theme React + TypeScript + Tailwind CSS frontend for the Cortex AI local-first multi-model AI developer platform.

## Features

- **Chat Interface** - Real-time conversational AI with markdown rendering and syntax highlighting
- **Pipeline Builder** - Chain multiple AI models together for complex workflows
- **Template Library** - Pre-built prompts with variable substitution
- **Dashboard** - Usage analytics, token tracking, and model metrics
- **Dark Theme** - Professional dark design with cyan, green, and purple accents
- **Responsive** - Optimized for desktop (1280px+)
- **Local-First** - Communicates with local Ollama/backend API

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Vite** - Lightning-fast build tool
- **React Markdown** - Markdown rendering in chat
- **React Syntax Highlighter** - Code block syntax highlighting

## Project Structure

```
src/
├── App.tsx                          # Main app with routing & layout
├── main.tsx                         # React entry point
├── index.css                        # Global styles
├── lib/
│   └── api.ts                       # Backend API client
├── hooks/
│   ├── useModels.ts                 # Models fetching hook
│   └── useHealth.ts                 # Health check polling hook
└── components/
    ├── Chat/
    │   ├── ChatView.tsx             # Main chat interface
    │   ├── ChatMessage.tsx          # Message renderer with markdown
    │   └── ConversationList.tsx      # Conversation sidebar
    ├── Pipeline/
    │   ├── PipelineView.tsx         # Pipeline list & runner
    │   └── PipelineBuilder.tsx      # Create new pipelines
    ├── Templates/
    │   ├── TemplatesView.tsx        # Template grid
    │   ├── TemplateBuilder.tsx      # Create templates
    │   └── TemplateModal.tsx        # Run template modal
    └── Dashboard/
        ├── DashboardView.tsx        # Dashboard main view
        ├── StatCard.tsx             # Statistics card component
        ├── TokenChart.tsx           # SVG bar chart
        └── UsageTable.tsx           # Recent activity table
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Configuration

### Backend API
By default, the frontend proxies `/api/*` requests to `http://localhost:7337`. To change this, edit `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://your-backend-url',
      changeOrigin: true,
    },
  },
}
```

### Theme Customization
Tailwind theme is defined in `tailwind.config.js`. Custom colors:
- `cortex-bg`: `#0a0a1a` (background)
- `cortex-card`: `#111827` (cards)
- `cortex-border`: `#1f2937` (borders)
- `cortex-cyan`: `#00d4ff` (accent 1)
- `cortex-green`: `#00ff88` (accent 2)
- `cortex-purple`: `#7c3aed` (accent 3)

## API Endpoints Used

The frontend communicates with these backend endpoints:

- `GET /health` - Health check
- `GET /api/models` - List available models
- `GET /api/conversations` - List conversations
- `GET /api/conversations/{id}` - Get conversation
- `POST /api/conversations` - Create conversation
- `DELETE /api/conversations/{id}` - Delete conversation
- `POST /api/chat/stream` - Stream chat response
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `DELETE /api/templates/{id}` - Delete template
- `POST /api/templates/{id}/run` - Run template
- `GET /api/pipelines` - List pipelines
- `POST /api/pipelines` - Create pipeline
- `POST /api/pipelines/{id}/run` - Run pipeline
- `GET /api/usage` - Get usage stats

## Key Components

### ChatView
Main chat interface with real-time message streaming, conversation history, and markdown rendering.

- Auto-scroll to bottom on new messages
- Shift+Enter for newline, Enter to send
- Suggested prompts for new conversations
- Model selection in top bar
- Loading indicators with animated dots

### PipelineView
Chain multiple AI models for complex workflows.

- Visual step-by-step pipeline builder
- Model and system prompt configuration per step
- Real-time pipeline execution with step results
- Input/output display for each step

### TemplatesView
Pre-built prompts with variable substitution.

- Grid layout with category badges
- Template builder with variable management
- Modal interface for template execution
- Support for multi-step prompts

### DashboardView
Usage analytics and model information.

- Total requests, tokens, models count
- Estimated savings vs cloud APIs
- SVG-based token distribution chart
- Recent activity table
- Model list with sizes and parameters

## Design System

### Colors (Dark Theme)
- **Background**: #0a0a1a
- **Cards**: #111827
- **Borders**: #1f2937
- **Cyan Accent**: #00d4ff
- **Green Accent**: #00ff88
- **Purple Accent**: #7c3aed

### Typography
- **Font**: Inter (Google Fonts) + system sans-serif fallback
- **Smooth animations**: 200ms transitions on hover
- **Loading states**: Animated pulse and bounce effects

### Responsive Design
- Optimized for 1280px+ desktop displays
- Sidebar: 240px fixed width
- Responsive grid layouts for templates and dashboard
- Mobile-friendly input areas

## Error Handling

- Connection lost banner when backend is unreachable
- User-friendly error messages in modals and alerts
- Loading skeleton states for async data
- Graceful fallbacks for empty states

## State Management

Uses React's built-in `useState` and `useEffect` hooks for state management. No Redux or other global state libraries needed - components manage their own state or receive props from parent components.

## Performance Optimizations

- Lazy loading of conversations and templates
- Pagination/limiting in tables and lists
- CSS animations use GPU-accelerated properties
- Efficient re-renders with proper dependency arrays
- Debounced API calls where applicable

## Development

### Type Safety
Full TypeScript support with strict mode enabled. All API responses are typed.

### Linting & Formatting
To maintain code quality, ensure you follow these conventions:
- Use functional components with hooks
- Keep components small and focused
- Use Tailwind utility classes for styling
- Add proper TypeScript types

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist/` directory to your web server
3. Ensure your backend API is properly configured
4. Update the API proxy configuration for your deployment environment

The built files are static HTML/CSS/JS and can be served by any web server.

## License

Proprietary - Cortex AI Platform
