# Customer Churn Prediction Frontend

A modern, attractive React frontend for the Customer Churn Prediction system. Displays customer information with real-time churn predictions, pagination, and a beautiful dashboard interface.

## Features

✨ **Key Features:**

- 📊 Display all customer information in a responsive table
- 🔄 Real-time churn predictions for each customer
- 📄 Pagination (10 customers per page)
- 🎨 Modern, attractive UI with Tailwind CSS
- 🚀 Fast performance with React Router
- 📱 Fully responsive design
- ⚡ Real-time loading states and error handling
- 🔌 Direct API integration with backend

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:5000` (see parent directory README)

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

The API endpoint is configured in `.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

Change this if your backend runs on a different URL.

## Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Server will hot-reload when you save changes.

## Building

```bash
# Build for production
npm run build

# Preview production build
npm run start
```

## Project Structure

```
app/
├── components/
│   └── CustomersList.tsx       # Main customer display component
├── lib/
│   └── api.ts                  # API utilities and types
├── routes/
│   ├── home.tsx                # Home page (dashboard)
│   └── +types/
├── app.css                      # Global styles
├── app.tsx                      # Root component
└── root.tsx                     # Root layout

public/                          # Static assets
```

## Features in Detail

### Customer Dashboard

- **Header**: Shows total customer count with branding
- **Customer Table**: Displays all key customer information
- **Churn Status Badge**: Visual indicator (red=will churn, green=will stay)
- **Confidence Meter**: Visual progress bar showing prediction confidence
- **Action Buttons**: Manually trigger predictions
- **Pagination**: Navigate through 10 customers per page

### Data Displayed

For each customer:

- **Customer ID** - Auto-generated unique identifier
- **Location & Gender** - Geography and gender information
- **Age** - Customer age in years
- **Credit Score** - Credit score (300-850)
- **Account Balance** - Current balance in currency
- **Tenure** - Years as customer
- **Active Member Status** - Whether customer is active
- **Churn Prediction** - AI prediction (Will Stay/Will Leave)
- **Churn Probability** - Percentage likelihood (0-100%)
- **Confidence Score** - Model confidence in prediction

### Pagination

- Shows 10 customers per page
- Smart page number display (shows 5 page buttons max)
- Previous/Next buttons
- Current page indicator
- Total customer count

### Real-time Predictions

- Predictions load automatically when viewing customers
- Manual prediction refresh button on each row
- Loading indicators during prediction
- Error handling with retry option
- Confidence meter visualization

## Error Handling

- **API Connection Error**: Shows friendly message if backend is unavailable
- **Prediction Errors**: Individual errors per customer with retry button
- **Network Issues**: Automatic retry with user feedback
- **Health Checks**: Verifies API connectivity before loading data

## Styling

Built with Tailwind CSS featuring:

- Gradient backgrounds
- Smooth animations
- Responsive design
- Professional color scheme (indigo/purple/blue)
- Hover effects and transitions
- Mobile-friendly layout

## API Integration

Connects to these backend endpoints:

```
GET  /data              - Get all customers
GET  /data/<id>         - Get specific customer
POST /predict           - Make churn prediction
GET  /data/stats        - Get statistics
GET  /                  - Health check
```

See [../API_ENDPOINTS.md](../API_ENDPOINTS.md) for full API documentation.

## Performance

- Fast pagination (client-side filtering)
- Lazy prediction loading
- Optimized re-renders
- Efficient data fetching
- Smooth animations

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server
npm run typecheck     # Run TypeScript checks
```

## Troubleshooting

**Issue**: "Cannot connect to API"

- **Solution**: Ensure backend is running on http://localhost:5000
- Run: `python main.py` in backend directory

**Issue**: No customers showing

- **Solution**: Create customers via API first
- Use: `curl -X POST http://localhost:5000/data ...`

**Issue**: Predictions not loading

- **Solution**: Check backend is running and responsive
- Try: `curl http://localhost:5000/`

**Issue**: Styling looks broken

- **Solution**: Tailwind CSS might not be built
- Run: `npm run dev` to rebuild

## Future Enhancements

- 📈 Add customer charts and analytics
- 🔍 Advanced filtering and search
- 📥 CSV/Excel export functionality
- 🎯 Customer segmentation views
- 🔔 Real-time notifications
- 🌙 Dark mode support
- 📱 Mobile app version

## Environment Variables

```env
VITE_API_URL=http://localhost:5000    # Backend API URL
```

## License

Same as parent project

## Support

For issues or questions:

1. Check backend is running: `curl http://localhost:5000/`
2. Verify network connection
3. Check browser console for error messages
4. Review backend logs for API issues

---

**Status**: Production Ready ✓
**Version**: 1.0.0
**Last Updated**: 2026
