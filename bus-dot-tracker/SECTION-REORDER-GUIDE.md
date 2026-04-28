# Section Reordering Feature Implementation Guide

## Overview
This guide explains how to add up/down arrow controls to reorder all major sections in the Bus DOT Tracker app.

## Implementation Steps

### 1. Add CSS Styles to styles.css

Add these styles at the end of your styles.css file:

```css
/* Section Reordering Styles */
.reorder-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.reorder-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.reorder-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(139, 92, 246, 0.4);
}

.reorder-btn.active {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
}

.section-reorder-controls {
    display: none;
    gap: 5px;
    margin-left: 15px;
}

.reorder-mode .section-reorder-controls {
    display: flex;
}

.reorder-arrow-btn {
    width: 36px;
    height: 36px;
    background: #6B7280;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.reorder-arrow-btn:hover:not(:disabled) {
    background: #4B5563;
    transform: scale(1.1);
}

.reorder-arrow-btn:disabled {
    background: #D1D5DB;
    cursor: not-allowed;
    opacity: 0.5;
}

.reorderable-section {
    transition: all 0.3s ease;
}

.reorder-mode .reorderable-section {
    border: 2px dashed #8B5CF6;
    border-radius: 12px;
    padding: 10px;
    margin: 10px 0;
}
```

### 2. Update Section Headers in index.html

Replace each major section's header to include reorder controls. Example:

```html
<!-- Trip Legality Overview - BEFORE -->
<div class="dashboard-section">
    <div class="section-header">
        <h2>🚦 Trip Legality Overview</h2>
        <button class="secondary-btn" onclick="showSection('multi-trip')">+ Add Trip</button>
    </div>
    ...
</div>

<!-- Trip Legality Overview - AFTER -->
<div class="dashboard-section reorderable-section" data-section-id="trip-legality">
    <div class="section-header">
        <div class="section-title-group">
            <h2>🚦 Trip Legality Overview</h2>
            <div class="section-reorder-controls">
                <button class="reorder-arrow-btn" onclick="moveSectionUp('trip-legality')" title="Move Up">▲</button>
                <button class="reorder-arrow-btn" onclick="moveSectionDown('trip-legality')" title="Move Down">▼</button>
            </div>
        </div>
        <button class="secondary-btn" onclick="showSection('multi-trip')">+ Add Trip</button>
    </div>
    ...
</div>
```

### 3. Add Section IDs to All Major Sections

Add these data attributes and classes to wrap each reorderable section:

- `class="reorderable-section"`
- `data-section-id="unique-id"`

**Section IDs to use:**
- `trip-legality` - Trip Legality Overview
- `driver-status` - Driver Status Overview  
- `upcoming-trips` - Upcoming Trips
- `quick-actions` - Quick Actions
- `trips-management` - Trips Management
- `vehicles-management` - Vehicles Management
- `pay-calculator` - Pay Calculator
- `multi-trip-planner` - Multi-Trip Planner
- `hos-calculator` - HOS Calculator
- `hours-summary` - Hours Summary
- `status-controls` - Status Controls
- `duty-log` - Duty Log
- `settings-section` - Settings

### 4. Add JavaScript Functions to script.js

Add these functions at the end of your script.js file:

```javascript
// Section Reordering
let reorderMode = false;

function toggleReorderMode() {
    reorderMode = !reorderMode;
    const container = document.querySelector('.container');
    const btn = document.getElementById('toggleReorderBtn');
    
    if (reorderMode) {
        container.classList.add('reorder-mode');
        btn.classList.add('active');
        btn.innerHTML = '<span>✓ Done Reordering</span>';
    } else {
        container.classList.remove('reorder-mode');
        btn.classList.remove('active');
        btn.innerHTML = '<span>🔀 Reorder Sections</span>';
        saveSectionOrder();
    }
}

function moveSectionUp(sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    const prevSection = section.previousElementSibling;
    
    // Skip non-reorderable elements
    let prev = prevSection;
    while (prev && !prev.classList.contains('reorderable-section')) {
        prev = prev.previousElementSibling;
    }
    
    if (prev) {
        section.parentNode.insertBefore(section, prev);
        animateMove(section);
    }
}

function moveSectionDown(sectionId) {
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    const nextSection = section.nextElementSibling;
    
    // Skip non-reorderable elements
    let next = nextSection;
    while (next && !next.classList.contains('reorderable-section')) {
        next = next.nextElementSibling;
    }
    
    if (next && next.nextElementSibling) {
        section.parentNode.insertBefore(section, next.nextElementSibling);
        animateMove(section);
    } else if (next) {
        section.parentNode.appendChild(section);
        animateMove(section);
    }
}

function animateMove(element) {
    element.style.transform = 'scale(1.05)';
    element.style.background = '#F3E8FF';
    setTimeout(() => {
        element.style.transform = '';
        element.style.background = '';
    }, 300);
}

function saveSectionOrder() {
    const sections = document.querySelectorAll('.reorderable-section');
    const order = Array.from(sections).map(section => section.dataset.sectionId);
    localStorage.setItem('sectionOrder', JSON.stringify(order));
    alert('Section order saved! ✅');
}

function loadSectionOrder() {
    const savedOrder = localStorage.getItem('sectionOrder');
    if (!savedOrder) return;
    
    try {
        const order = JSON.parse(savedOrder);
        const container = document.querySelector('.container');
        
        order.forEach(sectionId => {
            const section = document.querySelector(`[data-section-id="${sectionId}"]`);
            if (section) {
                container.appendChild(section);
            }
        });
    } catch (e) {
        console.error('Error loading section order:', e);
    }
}

// Load saved section order on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSectionOrder();
});
```

### 5. Update CSS for Section Header Layout

Add these styles to accommodate the reorder controls:

```css
.section-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}
```

## Usage Instructions

1. Click the  **"🔀 Reorder Sections"** button in the dashboard title area
2. Up (▲) and Down (▼) arrows appear on each section header
3. Click arrows to move sections up or down
4. Click **"✓ Done Reordering"** when finished
5. Section order is automatically saved to localStorage

## Benefits

✅ Personalize dashboard layout  
✅ Put frequently used sections first  
✅ Move rarely used sections to bottom  
✅ Order persists across page reloads  
✅ Easy to use with clear visual feedback

## Future Enhancements

- Drag-and-drop instead of buttons
- Reset to default order button
- Multiple saved layouts (profiles)
- Export/import section orders
