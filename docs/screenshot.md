# Cortex AI - UI Overview

## Design Theme
Cortex AI features a professional dark-themed SaaS dashboard with a futuristic tech aesthetic:
- **Primary Colors**: Deep dark background (#0a0a1a), cyan accents (#00d4ff), neon green highlights (#00ff88)
- **Typography**: Clean sans-serif with gradient text effects
- **Components**: Dark glass-morphism cards with subtle borders

## Main Interface

### Sidebar Navigation
Located on the left side of the application:
- **Logo**: "Cortex AI" branding with gradient text
- **Navigation Items**:
  - 💬 Chat - Real-time conversational AI interface
  - ⚙️ Pipelines - Multi-step AI workflow builder and executor
  - 📋 Templates - Pre-built prompts and workflows
  - 📊 Dashboard - Usage analytics and system statistics
- **Status Indicator**: Shows backend connection status (green when connected, red when disconnected)

### Chat View
The primary interface for interacting with local AI models:
- **Model Selector**: Dropdown to choose between available models (top-right)
- **Conversation List**: Left sidebar showing past conversations
  - New chat button for starting conversations
  - Quick delete buttons for removing conversations
- **Message Area**: Central scrollable area displaying conversation history
  - User messages: Aligned right with cyan styling
  - Assistant responses: Aligned left with markdown rendering support
  - Code blocks: Syntax-highlighted with language detection
- **Input Box**: Multi-line textarea with auto-expand
  - Send button with visual feedback
  - Suggested prompts on first load
  - Markdown rendering for responses

### Dashboard View
Analytics and system metrics:
- **Stats Grid**: Four cards showing:
  - Total Requests: Number of API calls made
  - Total Tokens: Cumulative token consumption
  - Models Used: Count and names of models utilized
  - Estimated Savings: Cost comparison with cloud AI services
- **Charts**: 
  - Token usage trends over time
  - Per-model token distribution
- **Usage Table**: Detailed breakdown of requests by model and time

### Templates View
Workflow template management:
- **Template List**: Browsable list of pre-built prompts
  - Quick action buttons (run, edit, delete)
  - Category labels and descriptions
- **Template Builder**: Modal form for creating custom templates
  - Name and description fields
  - Content editor with variable interpolation
  - Variable list management
- **Template Runner**: Execute template with variable substitution

### Pipelines View
Complex multi-step workflow builder:
- **Pipeline List**: Sidebar showing all configured pipelines
  - New pipeline creation button
  - Pipeline selection with description preview
- **Pipeline Builder**: Create multi-step workflows
  - Step list editor
  - Model selection per step
  - Prompt template editor
- **Pipeline Executor**: Run pipelines with input
  - Input textarea for initial data
  - Step-by-step result display
  - Result exporting functionality

## Responsive Design
- Desktop-first layout optimized for large screens
- Sidebar collapse responsive behavior
- Touch-friendly buttons and controls
- Accessible keyboard navigation throughout

## Visual Feedback
- Loading states with animated skeleton screens and pulsing indicators
- Error messages in red-tinted banners with dismiss buttons
- Success feedback through color changes and transitions
- Hover states on all interactive elements
- Smooth animations for state changes

## Technology Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom cortex theme
- **Markdown**: React Markdown for message rendering
- **Syntax Highlighting**: Syntax Highlighter component for code blocks
- **Build Tool**: Vite for optimized production builds
