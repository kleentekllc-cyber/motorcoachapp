# 🎨 DOT Hours Tracker Design System

Comprehensive component library and style guide for the Bus Driver DOT Hours Tracker application.

---

## 🔘 BUTTONS

### Primary Button
**Purpose:** Main actions (Save, Calculate, Add)  
**Class:** `.add-trip-btn`  
**CSS:**
```css
background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
color: white;
padding: 15px;
border-radius: 8px;
font-weight: 600;
```
**Usage:**
```html
<button class="add-trip-btn" onclick="saveTrip()">💾 Save Trip</button>
```

### Secondary Button
**Purpose:** Secondary actions (Cancel, View, Export)  
**Class:** `.secondary-btn`  
**CSS:**
```css
background: #2563EB;
color: white;
padding: 10px 20px;
border-radius: 8px;
font-weight: 600;
```
**Usage:**
```html
<button class="secondary-btn" onclick="cancelForm()">✖ Cancel</button>
```

### Danger Button
**Purpose:** Destructive actions (Delete, Remove)  
**Class:** `.table-action-btn.danger`  
**CSS:**
```css
background: #EF4444;
color: white;
padding: 6px 12px;
border-radius: 6px;
```
**Usage:**
```html
<button class="table-action-btn danger" onclick="removeTrip()">🗑️</button>
```

---

## 📝 INPUTS

### Text Input
**Purpose:** Single-line text entry  
**Class:** `.hos-input`  
**CSS:**
```css
width: 100%;
padding: 12px;
border: 2px solid #E5E7EB;
border-radius: 8px;
font-size: 1em;
```
**Usage:**
```html
<input type="text" class="hos-input" placeholder="Enter name">
```

### Number Input
**Purpose:** Numeric values  
**Class:** `.hos-input`  
**Usage:**
```html
<input type="number" class="hos-input" placeholder="Miles" min="0" step="0.1">
```

### DateTime Input
**Purpose:** Date and time selection  
**Class:** `.hos-input`  
**Usage:**
```html
<input type="date" class="hos-input">
<input type="time" class="hos-input">
```

### Dropdown Select
**Purpose:** Multiple choice selection  
**Class:** `.hos-input`  
**Usage:**
```html
<select class="hos-input">
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
</select>
```

### Toggle Checkbox
**Purpose:** Boolean on/off states  
**CSS:**
```css
width: 20px;
height: 20px;
cursor: pointer;
```
**Usage:**
```html
<label style="display: flex; align-items: center; gap: 10px;">
    <input type="checkbox" id="toggle" style="width: 20px; height: 20px;">
    <span>Safety Eligible</span>
</label>
```

---

## 🃏 CARDS

### Standard Card
**Purpose:** General content container  
**Class:** `.calc-card`, `.settings-card`  
**CSS:**
```css
background: white;
padding: 25px;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
```

### Stat Card
**Purpose:** Dashboard statistics  
**Class:** `.stat-card`  
**CSS:**
```css
background: white;
border-radius: 10px;
padding: 20px;
display: flex;
align-items: center;
gap: 15px;
```
**Structure:**
```html
<div class="stat-card">
    <div class="stat-icon">🚌</div>
    <div class="stat-content">
        <div class="stat-label">Trips Today</div>
        <div class="stat-value">5 Scheduled</div>
    </div>
</div>
```

### Driver Card (Vehicle)
**Purpose:** Vehicle/driver profile display  
**Class:** `.vehicle-card`  
**CSS:**
```css
background: white;
border-radius: 12px;
padding: 20px;
border: 3px solid #E5E7EB;
cursor: pointer;
```
**Structure:**
```html
<div class="vehicle-card">
    <div class="vehicle-header">
        <div class="vehicle-icon">🚌</div>
        <div class="vehicle-status-dot active"></div>
    </div>
    <div class="vehicle-info">
        <h4>Bus #001</h4>
        <div class="vehicle-detail">Type: <strong>Motorcoach</strong></div>
    </div>
</div>
```

### Pay Card (Overview)
**Purpose:** Pay overview display  
**Class:** `.pay-overview-card`  
**CSS:**
```css
border-radius: 12px;
padding: 25px;
border: 3px solid;
```
**Variants:**
- `.full-time-card` - Blue gradient
- `.part-time-card` - Yellow gradient

---

## 📊 TABLES

### Table Row
**Purpose:** Standard table row  
**CSS:**
```css
border-bottom: 1px solid #E5E7EB;
```
**HTML:**
```html
<tr>
    <td>Content</td>
</tr>
```

### Table Header
**Purpose:** Column headers  
**CSS:**
```css
background: linear-gradient(135deg, #374151 0%, #1F2937 100%);
color: white;
padding: 15px;
font-weight: 700;
```
**HTML:**
```html
<thead>
    <tr>
        <th>Column Name</th>
    </tr>
</thead>
```

### Table Cell
**Purpose:** Data cells  
**CSS:**
```css
padding: 15px;
border-bottom: 1px solid #E5E7EB;
color: #374151;
```

**Complete Table Example:**
```html
<table class="trips-table">
    <thead>
        <tr>
            <th>Trip #</th>
            <th>Date</th>
            <th>Distance</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Trip 1</td>
            <td>Apr 3, 2026</td>
            <td>250 mi</td>
        </tr>
    </tbody>
</table>
```

---

## 🗓️ TIMELINE SEGMENTS

### Drive Segment
**Purpose:** Driving time visualization  
**Class:** `.timeline-segment.segment-drive`  
**CSS:**
```css
background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
```
**Icon:** 🚗

### Stop Segment
**Purpose:** Passenger stops  
**Class:** `.timeline-segment.segment-stop`  
**CSS:**
```css
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
```
**Icon:** ⏸️

### Deadhead Segment
**Purpose:** Empty repositioning  
**Class:** `.timeline-segment.segment-deadhead`  
**CSS:**
```css
background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
```
**Icon:** 🚛

### Relay Segment
**Purpose:** Driver handoff  
**Class:** `.timeline-segment.segment-relay`  
**CSS:**
```css
background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);
```
**Icon:** 🔄

### Hotel Reset Segment
**Purpose:** Overnight rest period  
**Class:** `.timeline-segment.segment-hotel`  
**CSS:**
```css
background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
```
**Icon:** 🏨

**Timeline Usage:**
```html
<div class="horizontal-timeline-bar">
    <div class="timeline-segment segment-drive" style="width: 40%;">
        <div class="segment-icon">🚗</div>
        <div class="segment-label-text">Drive</div>
        <div class="segment-time">4h 30m</div>
    </div>
    <div class="timeline-segment segment-stop" style="width: 10%;">
        <div class="segment-icon">⏸️</div>
        <div class="segment-label-text">Stop</div>
        <div class="segment-time">15m</div>
    </div>
</div>
```

---

## 🏷️ BADGES

### Status Badge - Legal
**Purpose:** Compliant trips  
**Class:** `.status-badge.legal`  
**CSS:**
```css
background: #10B981;
color: white;
padding: 4px 10px;
border-radius: 12px;
font-size: 0.7em;
font-weight: 700;
text-transform: uppercase;
```
**Usage:**
```html
<span class="status-badge legal">LEGAL</span>
```

### Status Badge - Warning
**Purpose:** Trips needing attention  
**Class:** `.status-badge.relay_required` or `.status-badge.deadhead_required`  
**CSS:**
```css
background: #F59E0B;
color: white;
```
**Usage:**
```html
<span class="status-badge relay_required">RELAY REQUIRED</span>
```

### Status Badge - Illegal
**Purpose:** Non-compliant trips  
**Class:** `.status-badge.trip_not_possible_under_dot`  
**CSS:**
```css
background: #EF4444;
color: white;
```
**Usage:**
```html
<span class="status-badge trip_not_possible_under_dot">TRIP NOT POSSIBLE</span>
```

### Status Badge - Info
**Purpose:** Informational status  
**Class:** `.status-badge` (default)  
**CSS:**
```css
background: #3B82F6;
color: white;
```
**Usage:**
```html
<span class="status-badge hotel_required">HOTEL REQUIRED</span>
```

---

## 🎨 COLOR PALETTE

### Primary Colors
- **Primary Blue:** `#2563EB` - Main actions, headers
- **Success Green:** `#10B981` - Legal status, success states
- **Warning Orange:** `#F59E0B` - Warnings, approaching limits
- **Danger Red:** `#EF4444` - Violations, errors
- **Purple:** `#8B5CF6` - Vehicles, special features

### Neutral Colors
- **Dark Gray:** `#111827` - Primary text
- **Medium Gray:** `#6B7280` - Secondary text
- **Light Gray:** `#E5E7EB` - Borders
- **Background:** `#F9FAFB` - Page background

### Gradient Patterns
```css
/* Primary Gradient */
background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);

/* Success Gradient */
background: linear-gradient(135deg, #10B981 0%, #059669 100%);

/* Warning Gradient */
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);

/* Danger Gradient */
background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
```

---

## 📐 SPACING SYSTEM

- **xs:** `5px`
- **sm:** `10px`
- **md:** `15px`
- **lg:** `20px`
- **xl:** `25px`
- **2xl:** `30px`

---

## 📏 TYPOGRAPHY

### Headings
- **H1:** `2em` - Page titles
- **H2:** `1.5em` - Section titles
- **H3:** `1.4em` - Card titles
- **H4:** `1.2em` - Subsection titles

### Body Text
- **Base:** `1em (16px)`
- **Small:** `0.9em`
- **Label:** `0.85em`

### Font Weights
- **Regular:** `400`
- **Semibold:** `600`
- **Bold:** `700`

---

## 🔧 COMPONENT ANATOMY

### Input Group
```html
<div class="input-group">
    <label for="inputId">Label <span class="required">*</span></label>
    <input type="text" id="inputId" class="hos-input" placeholder="Enter value">
</div>
```

### Stat Card Anatomy
```html
<div class="stat-card">
    <div class="stat-icon">🚌</div>
    <div class="stat-content">
        <div class="stat-label">Trips Today</div>
        <div class="stat-value">5 Scheduled</div>
        <div class="stat-duration">Available for trips</div>
    </div>
</div>
```

### Timeline Item Anatomy
```html
<div class="timeline-item" style="border-left-color: #EF4444;">
    <div class="timeline-time">08:00 AM</div>
    <div class="timeline-event">🚗 Driving</div>
    <div class="timeline-duration">4h 30m - En route</div>
</div>
```

---

## 🎯 USAGE GUIDELINES

### When to Use Each Button Type
1. **Primary:** Main call-to-action per section (Save, Calculate, Add)
2. **Secondary:** Supporting actions (Cancel, View, Export)
3. **Danger:** Irreversible deletions (Delete, Remove, Clear)

### Status Badge Color Logic
1. **Legal (Green):** 0-8 hours driving, all limits satisfied
2. **Warning (Orange):** 8-10 hours driving, approaching limits
3. **Illegal (Red):** >10 hours driving, exceeds limits
4. **Info (Blue):** Special requirements (Hotel, Relay)

### Timeline Segment Colors
1. **Red (Drive):** Active driving time
2. **Orange (Stop):** Passenger stops
3. **Gray (Deadhead):** Empty repositioning
4. **Teal (Relay):** Driver handoff
5. **Pink (Hotel):** Overnight rest

---

## 🔍 ACCESSIBILITY

- All buttons have `:hover` and `:focus` states
- Color contrasts meet WCAG AA standards
- Icon + text labels for clarity
- Form inputs have clear labels with required indicators

---

## 📱 RESPONSIVE BEHAVIOR

### Grid Breakpoints
- **Desktop:** 4 columns (stat cards)
- **Tablet:** 2 columns
- **Mobile:** 1 column stacked

### Adaptive Components
- Settings tabs collapse on mobile
- Tables scroll horizontally on small screens
- Timeline segments adjust width percentage

---

## 🎨 GRADIENT LIBRARY

```css
/* Dashboard Cards */
.trips-today-stat { background: gradient green }
.drivers-stat { background: gradient blue }
.compliance-stat { background: gradient green }
.vehicles-stat { background: gradient orange }

/* Hours Cards */
.hours-card.driving { background: gradient red }
.hours-card.duty { background: gradient blue }
.hours-card.break { background: gradient green }
.hours-card.weekly { background: gradient pink-yellow }

/* Status Indicators */
.legal-segment { background: gradient green }
.warning-segment { background: gradient orange }
.illegal-segment { background: gradient red }
```

---

## 🛠️ UTILITY CLASSES

```css
.hidden { display: none !important; }
.required { color: #EF4444; font-weight: bold; }
.no-logs { text-align: center; color: #999; font-style: italic; }
```

---

## 📋 FORM PATTERNS

### Standard Form Section
```html
<div class="form-section">
    <h4>🚐 Section Title</h4>
    <div class="trip-input-grid">
        <div class="input-group">
            <label for="field1">Field Label <span class="required">*</span></label>
            <input type="text" id="field1" class="hos-input">
        </div>
    </div>
</div>
```

### Form Actions
```html
<div class="form-actions">
    <button class="add-trip-btn">💾 Save</button>
    <button class="secondary-btn">Cancel</button>
</div>
```

---

## 🎭 ANIMATION PATTERNS

### Pulse Animation (Status Dots)
```css
@keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
```

### Hover Lift
```css
transition: transform 0.3s;
/* On hover: */
transform: translateY(-5px);
```

### Glow Effect (Active Zones)
```css
box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
```

---

## 📦 COMPONENT LIBRARY SUMMARY

### Total Components
- **Buttons:** 3 types (Primary, Secondary, Danger)
- **Inputs:** 5 types (Text, Number, DateTime, Dropdown, Toggle)
- **Cards:** 4 types (Standard, Stat, Driver, Pay)
- **Tables:** 3 parts (Row, Header, Cell)
- **Timeline:** 5 segments (Drive, Stop, Deadhead, Relay, Hotel)
- **Badges:** 4 statuses (Legal, Warning, Illegal, Info)

### Total CSS Classes
- **60+** unique component classes
- **15+** gradient patterns
- **10+** animation effects
- **25+** utility classes

---

## 🚀 QUICK REFERENCE

### Most Used Classes
1. `.add-trip-btn` - Primary action buttons
2. `.hos-input` - All form inputs
3. `.calc-card` - Content containers
4. `.status-badge` - Status indicators
5. `.timeline-segment` - Timeline visualization
6. `.stat-card` - Dashboard statistics

### Common Patterns
1. **Section Header:** Title + Action Button
2. **Form Section:** H4 + Input Grid + Save Button
3. **Table Section:** Header + Body + Action Buttons
4. **Card Grid:** Responsive grid layout
5. **Timeline:** Horizontal bar + Detailed list

---

*Design System Version 1.0 - Last Updated: April 3, 2026*
