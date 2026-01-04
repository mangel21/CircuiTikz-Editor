/**
 * CircuiTikZ Visual Editor - Main Application
 */

class CircuitEditor {
    constructor() {
        // Canvas elements
        this.gridCanvas = document.getElementById('gridCanvas');
        this.mainCanvas = document.getElementById('mainCanvas');
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.ctx = this.mainCanvas.getContext('2d');
        this.canvasWrapper = document.getElementById('canvasWrapper');

        // State
        this.gridSize = 20;
        this.components = [];
        this.wires = [];
        this.selectedComponent = null;
        this.selectedWire = null;
        this.currentTool = 'select';
        this.isDragging = false;
        this.isDrawingWire = false;
        this.wireStart = null;
        this.dragOffset = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.nextId = 1;
        this.componentCounters = {};

        // Undo/Redo history
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;

        // Terminal hover state
        this.hoveredTerminal = null;

        // Wire endpoint dragging
        this.isDraggingWireEnd = false;
        this.draggingWireEndpoint = null; // { wire, endpoint: 1 or 2 }
        this.hoveredWireEndpoint = null;

        // Component hover for visual feedback
        this.hoveredComponent = null;

        // Pan state (middle mouse button)
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.viewportOffset = { x: 0, y: 0 };

        // Area selection state
        this.isAreaSelecting = false;
        this.areaSelectStart = null;
        this.areaSelectEnd = null;
        this.selectedComponents = []; // For multi-select
        this.selectedWires = []; // For multi-select

        // Wire dragging states
        this.isDraggingWireBody = false;
        this.draggedWire = null;
        this.draggedSegment = null; // 'h', 'v', 'h1', 'v1', etc.
        this.dragStartOffset = { x: 0, y: 0 };

        // Zoom state
        this.zoomLevel = 1.0;

        // Clipboard for copy/paste
        this.clipboard = null;

        // Initialize
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.populateComponentLibrary();
        this.setupZoom();
        this.render();
    }

    setupZoom() {
        const zoomSelect = document.getElementById('zoomSelect');
        if (zoomSelect) {
            zoomSelect.addEventListener('change', (e) => {
                this.zoomLevel = parseFloat(e.target.value);
                this.setupCanvas();
                this.render();
            });
        }
    }

    setupCanvas() {
        const rect = this.canvasWrapper.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        this.gridCanvas.width = width;
        this.gridCanvas.height = height;
        this.mainCanvas.width = width;
        this.mainCanvas.height = height;

        // Center the origin on initial load (only if viewport hasn't been modified)
        if (this.viewportOffset.x === 0 && this.viewportOffset.y === 0) {
            this.viewportOffset.x = width / (2 * this.zoomLevel);
            this.viewportOffset.y = height / (2 * this.zoomLevel);
        }

        this.drawGrid();
    }

    drawGrid() {
        const ctx = this.gridCtx;
        const width = this.gridCanvas.width;
        const height = this.gridCanvas.height;
        const zoom = this.zoomLevel;
        const scaledGrid = this.gridSize * zoom;

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#21262d';
        ctx.lineWidth = 1;

        const offsetX = (this.viewportOffset.x * zoom) % scaledGrid;
        const offsetY = (this.viewportOffset.y * zoom) % scaledGrid;

        // Draw vertical lines
        for (let x = offsetX; x <= width; x += scaledGrid) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = offsetY; y <= height; y += scaledGrid) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(width, y + 0.5);
            ctx.stroke();
        }

        // Draw major grid lines every 5 cells
        ctx.strokeStyle = '#30363d';
        const majorInterval = scaledGrid * 5;
        const majorOffsetX = (this.viewportOffset.x * zoom) % majorInterval;
        const majorOffsetY = (this.viewportOffset.y * zoom) % majorInterval;

        for (let x = majorOffsetX; x <= width; x += majorInterval) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, height);
            ctx.stroke();
        }

        for (let y = majorOffsetY; y <= height; y += majorInterval) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(width, y + 0.5);
            ctx.stroke();
        }

        // Draw Origin Axes (Bold)
        const originX = this.viewportOffset.x * zoom;
        const originY = this.viewportOffset.y * zoom;

        if (originX >= 0 && originX <= width) {
            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(originX + 0.5, 0);
            ctx.lineTo(originX + 0.5, height);
            ctx.stroke();
        }

        if (originY >= 0 && originY <= height) {
            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, originY + 0.5);
            ctx.lineTo(width, originY + 0.5);
            ctx.stroke();
        }
    }

    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    populateComponentLibrary() {
        const container = document.getElementById('componentCategories');
        container.innerHTML = '';

        for (const [categoryKey, category] of Object.entries(COMPONENTS)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';

            categoryDiv.innerHTML = `
                <button class="category-header">
                    <span class="arrow">▼</span>
                    ${category.name}
                </button>
                <div class="category-items"></div>
            `;

            const itemsContainer = categoryDiv.querySelector('.category-items');

            for (const [itemKey, item] of Object.entries(category.items)) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'component-item';
                itemDiv.draggable = true;
                itemDiv.dataset.category = categoryKey;
                itemDiv.dataset.component = itemKey;

                itemDiv.innerHTML = `
                    <svg viewBox="-35 -20 70 40" xmlns="http://www.w3.org/2000/svg">
                        ${item.svg}
                    </svg>
                    <span class="name">${item.name}</span>
                `;

                itemsContainer.appendChild(itemDiv);
            }

            // Toggle category
            const header = categoryDiv.querySelector('.category-header');
            header.addEventListener('click', () => {
                categoryDiv.classList.toggle('collapsed');
            });

            container.appendChild(categoryDiv);
        }

        // Setup drag events for component items
        this.setupDragEvents();
    }

    setupDragEvents() {
        const items = document.querySelectorAll('.component-item');

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    category: item.dataset.category,
                    component: item.dataset.component
                }));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });

        // Canvas events
        this.mainCanvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.mainCanvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.mainCanvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.mainCanvas.addEventListener('mouseleave', () => this.onMouseLeave());

        // Drop events for canvas
        this.mainCanvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.mainCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.onDrop(e);
        });

        // Toolbar buttons
        document.getElementById('selectTool').addEventListener('click', () => this.setTool('select'));
        document.getElementById('wireTool').addEventListener('click', () => this.setTool('wire'));
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').onclick = () => this.redo();
        document.getElementById('rotateLeftBtn').onclick = () => this.rotateSelected(90);
        document.getElementById('rotateRightBtn').onclick = () => this.rotateSelected(-90);
        document.getElementById('deleteBtn').onclick = () => this.deleteSelected();
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());

        // Clipboard buttons
        document.getElementById('copyBtn').onclick = () => this.copySelected();
        document.getElementById('cutBtn').onclick = () => this.cutSelected();
        document.getElementById('pasteBtn').onclick = () => this.paste();

        // View utility buttons
        document.getElementById('fitViewBtn').onclick = () => this.fitView();
        document.getElementById('centerOriginBtn').onclick = () => this.centerAtOrigin();
        document.getElementById('testAllBtn').onclick = () => this.testAllComponents();

        // Grid size
        document.getElementById('gridSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.drawGrid();
            this.render();
        });

        // Code panel
        document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyCode());
        document.getElementById('toggleCodeBtn').addEventListener('click', () => {
            document.querySelector('.code-panel').classList.toggle('collapsed');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Scroll wheel zoom
        this.mainCanvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Search
        document.getElementById('componentSearch').addEventListener('input', (e) => {
            this.filterComponents(e.target.value);
        });

        // Set initial tool
        this.setTool('select');
    }

    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + 'Tool').classList.add('active');

        // Reset wire drawing state
        if (tool !== 'wire') {
            this.isDrawingWire = false;
            this.wireStart = null;
        }

        this.render();
    }

    onMouseDown(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Transform coordinates based on zoom and viewport offset
        const x = (rawX / this.zoomLevel) - this.viewportOffset.x;
        const y = (rawY / this.zoomLevel) - this.viewportOffset.y;

        // Middle mouse button = pan
        if (e.button === 1) {
            e.preventDefault();
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.mainCanvas.style.cursor = 'grabbing';
            return;
        }

        if (this.currentTool === 'wire') {
            // Start drawing wire - snap to terminal or grid
            this.isDrawingWire = true;
            const snap = this.snapToTerminalOrGrid(x, y);
            this.wireStart = { x: snap.x, y: snap.y };
            this.wireStartInfo = snap; // Store snap info for later
        } else {
            // Check if clicking on a wire endpoint first (for dragging)
            const wireEnd = this.findWireEndpoint(x, y, 8);
            if (wireEnd) {
                this.saveState();
                this.isDraggingWireEnd = true;
                this.draggingWireEndpoint = wireEnd;
                this.selectWire(wireEnd.wire);
                return;
            }

            // Check if clicking on a component
            const clicked = this.getComponentAt(x, y);

            if (clicked) {
                // Save state before moving (for undo)
                this.saveState();

                // If the clicked component is already part of a multi-selection, drag all selected components
                if (this.selectedComponents.includes(clicked)) {
                    // Start dragging multi-selection
                    this.isDragging = true;
                    this.dragOffset = { x, y }; // Use absolute mouse pos to track delta
                } else {
                    // Normal single component drag
                    this.dragStartPos = { x: clicked.x, y: clicked.y };
                    this.selectComponent(clicked);
                    this.isDragging = true;
                    this.dragOffset = {
                        x: x - clicked.x,
                        y: y - clicked.y
                    };
                }
            } else {
                // Check if clicking on a wire body for dragging
                const clickedWire = this.getWireAt(x, y);
                if (clickedWire) {
                    this.saveState();
                    this.isDraggingWireBody = true;
                    this.draggedWire = clickedWire;
                    this.selectWire(clickedWire);
                    // Determine if we clicked a horizontal or vertical segment
                    this.draggedSegment = this.getWireSegmentAt(x, y, clickedWire);
                    this.dragStartOffset = { x, y };

                    // SMART DRAG: If endpoints are fixed, insert bridge segments
                    // SMART DRAG: If endpoints are fixed (terminals), insert bridge segments
                    [1, 2].forEach(ptIdx => {
                        const px = ptIdx === 1 ? clickedWire.x1 : clickedWire.x2;
                        const py = ptIdx === 1 ? clickedWire.y1 : clickedWire.y2;

                        const atTerminal = this.findNearestTerminal(px, py, 5);

                        if (atTerminal) {
                            // Insert bridge wire
                            this.wires.push({
                                id: this.nextId++,
                                x1: px, y1: py,
                                x2: px, y2: py,
                                cornerMode: 'hv',
                                isSmartBridge: true // Flag to allow stretching
                            });
                        }
                    });
                } else {
                    // Start area selection
                    this.deselectAll();
                    this.isAreaSelecting = true;
                    this.areaSelectStart = { x, y };
                    this.areaSelectEnd = { x, y };
                }
            }
        }

        this.render();
    }

    onMouseMove(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Transform coordinates based on zoom and viewport offset
        const x = (rawX / this.zoomLevel) - this.viewportOffset.x;
        const y = (rawY / this.zoomLevel) - this.viewportOffset.y;

        this.mousePos = { x, y };

        // Update coordinates display (show world coordinates)
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        document.getElementById('mouseCoords').textContent = `X: ${gridX}, Y: ${gridY}`;

        // Handle panning
        if (this.isPanning) {
            const dx = (e.clientX - this.panStart.x) / this.zoomLevel;
            const dy = (e.clientY - this.panStart.y) / this.zoomLevel;
            this.viewportOffset.x += dx;
            this.viewportOffset.y += dy;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.drawGrid();
            this.render();
            return;
        }

        // Handle wire body dragging
        if (this.isDraggingWireBody && this.draggedWire) {
            const dx = x - this.dragStartOffset.x;
            const dy = y - this.dragStartOffset.y;

            // Only move if we've moved significantly (snap to grid logic)
            if (Math.abs(dx) >= this.gridSize || Math.abs(dy) >= this.gridSize) {
                const snapDX = Math.round(dx / this.gridSize) * this.gridSize;
                const snapDY = Math.round(dy / this.gridSize) * this.gridSize;

                if (snapDX !== 0 || snapDY !== 0) {
                    this.moveWireSegment(this.draggedWire, this.draggedSegment, snapDX, snapDY);
                    this.dragStartOffset.x += snapDX;
                    this.dragStartOffset.y += snapDY;
                    this.render();
                }
            }
            return;
        }

        // Handle area selection
        if (this.isAreaSelecting) {
            this.areaSelectEnd = { x, y };
            this.render();
            return;
        }

        // Check for terminal hover (for visual feedback in wire mode)
        if (this.currentTool === 'wire') {
            this.hoveredTerminal = this.findNearestTerminal(x, y, 15);
            this.hoveredWireEndpoint = null;
            this.hoveredComponent = null;
        } else if (this.currentTool === 'select') {
            // Check for wire endpoint hover
            this.hoveredWireEndpoint = this.findWireEndpoint(x, y, 8);
            this.hoveredTerminal = null;
            // Check for component hover (for visual feedback)
            if (!this.isDragging && !this.isDraggingWireEnd) {
                this.hoveredComponent = this.getComponentAt(x, y);
            }
        }

        // Handle wire endpoint dragging
        if (this.isDraggingWireEnd && this.draggingWireEndpoint) {
            const snap = this.snapToTerminalOrGrid(x, y);
            const wire = this.draggingWireEndpoint.wire;
            const oldX = this.draggingWireEndpoint.endpoint === 1 ? wire.x1 : wire.x2;
            const oldY = this.draggingWireEndpoint.endpoint === 1 ? wire.y1 : wire.y2;

            if (this.draggingWireEndpoint.endpoint === 1) {
                wire.x1 = snap.x;
                wire.y1 = snap.y;
            } else {
                wire.x2 = snap.x;
                wire.y2 = snap.y;
            }

            // Move connected wires
            this.moveConnectedWireEndpoints(oldX, oldY, snap.x, snap.y, wire);

            this.render();
            return;
        }

        if (this.isDragging) {
            if (this.selectedComponents.length > 0) {
                // Multi-component dragging
                const dx = x - this.dragOffset.x;
                const dy = y - this.dragOffset.y;

                // We only snap if we've moved at least one grid unit
                if (Math.abs(dx) >= this.gridSize || Math.abs(dy) >= this.gridSize) {
                    const snapDX = Math.round(dx / this.gridSize) * this.gridSize;
                    const snapDY = Math.round(dy / this.gridSize) * this.gridSize;

                    if (snapDX !== 0 || snapDY !== 0) {
                        this.selectedComponents.forEach(comp => {
                            const oldX = comp.x;
                            const oldY = comp.y;
                            comp.x += snapDX;
                            comp.y += snapDY;
                            this.moveWiresConnectedToComponent(comp, snapDX, snapDY);
                        });
                        this.selectedWires.forEach(wire => {
                            wire.x1 += snapDX;
                            wire.y1 += snapDY;
                            wire.x2 += snapDX;
                            wire.y2 += snapDY;
                        });
                        this.dragOffset.x += snapDX;
                        this.dragOffset.y += snapDY;
                    }
                }
            } else if (this.selectedComponent) {
                // Single component dragging
                const newX = this.snapToGrid(x - this.dragOffset.x);
                const newY = this.snapToGrid(y - this.dragOffset.y);
                const deltaX = newX - this.selectedComponent.x;
                const deltaY = newY - this.selectedComponent.y;

                if (deltaX !== 0 || deltaY !== 0) {
                    // Move wires connected to this component's terminals
                    this.moveWiresConnectedToComponent(this.selectedComponent, deltaX, deltaY);

                    this.selectedComponent.x = newX;
                    this.selectedComponent.y = newY;
                }
            }
            this.render();
        } else if (this.isDrawingWire) {
            this.render();
        } else if (this.currentTool === 'wire' || this.currentTool === 'select') {
            // Render to show terminal/endpoint/component highlights
            this.render();
        }
    }

    onMouseUp(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Transform coordinates based on zoom and viewport offset
        const x = (rawX / this.zoomLevel) - this.viewportOffset.x;
        const y = (rawY / this.zoomLevel) - this.viewportOffset.y;

        // Handle pan release
        if (this.isPanning && e.button === 1) {
            this.isPanning = false;
            this.mainCanvas.style.cursor = '';
            return;
        }

        // Handle wire endpoint dragging end
        if (this.isDraggingWireEnd) {
            this.isDraggingWireEnd = false;
            this.draggingWireEndpoint = null;
            this.updateCode();
            this.render();
            return;
        }

        if (this.isDrawingWire && this.wireStart) {
            // Snap end to terminal or grid
            const endSnap = this.snapToTerminalOrGrid(x, y);
            const endX = endSnap.x;
            const endY = endSnap.y;

            // Only create wire if it has length
            if (endX !== this.wireStart.x || endY !== this.wireStart.y) {
                // Save state for undo
                this.saveState();

                // Determine corner mode based on starting orientation
                // If the wire starts vertically (Y changes more), use vertical-first (|-)
                // If the wire starts horizontally (X changes more), use horizontal-first (-|)
                const isHorizontal = Math.abs(this.wireStart.y - endY) < 1;
                const isVertical = Math.abs(this.wireStart.x - endX) < 1;
                let cornerMode = 'hv'; // horizontal first, then vertical (-|)

                if (!isHorizontal && !isVertical) {
                    // Check the original wire start orientation (from terminal or wire)
                    if (this.wireStartInfo && this.wireStartInfo.snappedToTerminal) {
                        // Get the component rotation to determine orientation
                        const comp = this.components.find(c => c.id === this.wireStartInfo.terminal.componentId);
                        if (comp && (comp.rotation === 90 || comp.rotation === 270)) {
                            cornerMode = 'vh'; // vertical first, then horizontal (|-)
                        }
                    } else if (this.wireStartInfo && this.wireStartInfo.snappedToWireEnd) {
                        // Check the orientation of the wire we're connecting to
                        const sourceWire = this.wireStartInfo.wireEnd.wire;
                        const isSourceVertical = Math.abs(sourceWire.x1 - sourceWire.x2) < 2;
                        if (isSourceVertical) {
                            cornerMode = 'vh'; // vertical first (|-)
                        }
                    }
                }

                const newWire = {
                    id: this.nextId++,
                    x1: this.wireStart.x,
                    y1: this.wireStart.y,
                    x2: endX,
                    y2: endY,
                    cornerMode: cornerMode // 'hv' = horizontal then vertical (-|), 'vh' = vertical then horizontal (|-)
                };

                // NEW: Split wire if snapped to body
                if (endSnap.snappedToWireBody) {
                    this.splitWireAtPoint(endSnap.wire, endX, endY);
                }
                if (this.wireStartInfo && this.wireStartInfo.snappedToWireBody) {
                    this.splitWireAtPoint(this.wireStartInfo.wire, this.wireStart.x, this.wireStart.y);
                }

                // Check if we should merge with an existing wire
                let merged = false;
                if (endSnap.snappedToWireEnd) {
                    const existingWire = endSnap.wireEnd.wire;
                    const mergedWire = this.mergeWires(existingWire, newWire);
                    if (mergedWire) {
                        const idx = this.wires.indexOf(existingWire);
                        if (idx !== -1) {
                            this.wires[idx] = mergedWire;
                            merged = true;
                        }
                    }
                }

                if (!merged && this.wireStartInfo && this.wireStartInfo.snappedToWireEnd) {
                    const existingWire = this.wireStartInfo.wireEnd.wire;
                    const mergedWire = this.mergeWires(existingWire, newWire);
                    if (mergedWire) {
                        const idx = this.wires.indexOf(existingWire);
                        if (idx !== -1) {
                            this.wires[idx] = mergedWire;
                            merged = true;
                        }
                    }
                }

                if (!merged) {
                    this.wires.push(newWire);
                }

                this.updateCode();
            }

            this.wireStart = null;
            this.wireStartInfo = null;
            this.isDrawingWire = false;
        }

        // Update code when drag ends
        if ((this.isDragging && (this.selectedComponent || this.selectedComponents.length > 0)) ||
            this.isDraggingWireBody) {

            // If dragging a single component, try to insert it on wire
            if (this.isDragging && this.selectedComponent && this.selectedComponents.length === 0) {
                // Ensure name exists (critical for anchors)
                if (!this.selectedComponent.name) {
                    this.selectedComponent.name = this.generateComponentName(this.selectedComponent.type);
                }
                this.insertComponentOnWire(this.selectedComponent);
            }

            this.cleanupWires();
            this.updateCode();
        }

        // Handle area selection completion
        if (this.isAreaSelecting && this.areaSelectStart && this.areaSelectEnd) {
            this.completeAreaSelection();
        }

        if (this.isDrawingWire) {
            this.cleanupWires();
        }

        if (this.isDraggingWireBody) {
            // Clean up bridge flags
            this.wires.forEach(w => delete w.isSmartBridge);
            this.cleanupWires();
        }

        this.isAreaSelecting = false;
        this.areaSelectStart = null;
        this.areaSelectEnd = null;
        this.isDragging = false;
        this.isDraggingWireBody = false;
        this.draggedWire = null;
        this.draggedSegment = null;
        this.dragStartPos = null;
        this.render();
    }

    onMouseLeave() {
        this.isDragging = false;
        this.isDraggingWireBody = false;
        this.draggedWire = null;
        this.draggedSegment = null;
        this.isDraggingWireEnd = false;
        this.isDrawingWire = false;
        this.wireStart = null;
        this.wireStartInfo = null;
        this.hoveredTerminal = null;
        this.hoveredWireEndpoint = null;
        this.draggingWireEndpoint = null;
        this.isPanning = false;
        this.isAreaSelecting = false;
        this.areaSelectStart = null;
        this.areaSelectEnd = null;
        this.mainCanvas.style.cursor = '';
        this.render();
    }

    completeAreaSelection() {
        // Find all components and wires within the selection rectangle
        const x1 = Math.min(this.areaSelectStart.x, this.areaSelectEnd.x);
        const y1 = Math.min(this.areaSelectStart.y, this.areaSelectEnd.y);
        const x2 = Math.max(this.areaSelectStart.x, this.areaSelectEnd.x);
        const y2 = Math.max(this.areaSelectStart.y, this.areaSelectEnd.y);

        this.selectedComponents = this.components.filter(comp => {
            return comp.x >= x1 && comp.x <= x2 && comp.y >= y1 && comp.y <= y2;
        });

        this.selectedWires = this.wires.filter(wire => {
            const wireInBox = (wire.x1 >= x1 && wire.x1 <= x2 && wire.y1 >= y1 && wire.y1 <= y2) ||
                (wire.x2 >= x1 && wire.x2 <= x2 && wire.y2 >= y1 && wire.y2 <= y2);
            return wireInBox;
        });

        // If only one item selected, use single selection
        if (this.selectedComponents.length === 1 && this.selectedWires.length === 0) {
            this.selectComponent(this.selectedComponents[0]);
            this.selectedComponents = [];
        } else if (this.selectedWires.length === 1 && this.selectedComponents.length === 0) {
            this.selectWire(this.selectedWires[0]);
            this.selectedWires = [];
        }

        this.updateCode();
    }

    moveWiresConnectedToComponent(comp, deltaX, deltaY) {
        // Get component terminals before movement
        const terminals = this.getComponentTerminals(comp);
        const rotation = comp.rotation || 0;
        const isCompVertical = (rotation === 90 || rotation === 270);

        terminals.forEach(term => {
            // Find wires connected to this terminal position
            this.wires.forEach(wire => {
                const eps = 2;
                let endpointMoved = 0;

                // Check endpoint 1
                if (Math.abs(wire.x1 - term.x) < eps && Math.abs(wire.y1 - term.y) < eps) {
                    const oldX = wire.x1;
                    const oldY = wire.y1;
                    wire.x1 += deltaX;
                    wire.y1 += deltaY;
                    endpointMoved = 1;
                    this.moveConnectedWireEndpoints(oldX, oldY, wire.x1, wire.y1, wire);
                }
                // Check endpoint 2
                else if (Math.abs(wire.x2 - term.x) < eps && Math.abs(wire.y2 - term.y) < eps) {
                    const oldX = wire.x2;
                    const oldY = wire.y2;
                    wire.x2 += deltaX;
                    wire.y2 += deltaY;
                    endpointMoved = 2;
                    this.moveConnectedWireEndpoints(oldX, oldY, wire.x2, wire.y2, wire);
                }

                if (endpointMoved > 0) {
                    // Update cornerMode if the wire is no longer orthogonal
                    const isHorizontal = Math.abs(wire.y1 - wire.y2) < 1;
                    const isVertical = Math.abs(wire.x1 - wire.x2) < 1;

                    if (!isHorizontal && !isVertical) {
                        // Decide corner mode based on terminal orientation
                        if (isCompVertical) {
                            // Vertical terminal: wire should start/end vertically
                            // If start (1) moves: vertical-first (|-)
                            // If end (2) moves: horizontal-first (-|) -> enters vertically
                            wire.cornerMode = (endpointMoved === 1) ? 'vh' : 'hv';
                        } else {
                            // Horizontal terminal: wire should start/end horizontally
                            // If start (1) moves: horizontal-first (-|)
                            // If end (2) moves: vertical-first (|-) -> enters horizontally
                            wire.cornerMode = (endpointMoved === 1) ? 'hv' : 'vh';
                        }
                    }
                }
            });
        });
    }

    moveConnectedWireEndpoints(oldX, oldY, newX, newY, excludeWire, visited = new Set()) {
        if (visited.has(excludeWire.id)) return;
        visited.add(excludeWire.id);

        const eps = 3;
        this.wires.forEach(wire => {
            if (wire === excludeWire) return;
            let moved = false;

            // Check both endpoints
            for (let pt = 1; pt <= 2; pt++) {
                const px = pt === 1 ? wire.x1 : wire.x2;
                const py = pt === 1 ? wire.y1 : wire.y2;

                if (Math.abs(px - oldX) < eps && Math.abs(py - oldY) < eps) {
                    let pin = false;
                    if (this.isDraggingWireBody) {
                        // SMART DRAG: Only pin the P1 of a tagged smart bridge.
                        // All other wires MUST follow to maintain cluster connectivity.
                        if (wire.isSmartBridge && pt === 1) {
                            if (this.findNearestTerminal(px, py, 5)) {
                                pin = true;
                            }
                        }
                    }

                    if (!pin) {
                        if (pt === 1) { wire.x1 = newX; wire.y1 = newY; }
                        else { wire.x2 = newX; wire.y2 = newY; }
                        moved = true;
                    }
                }
            }

            if (moved) {
                this.moveConnectedWireEndpoints(oldX, oldY, newX, newY, wire, visited);
            }
        });
    }

    onDrop(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Transform coordinates based on zoom and viewport offset (same as onMouseDown)
        const x = this.snapToGrid((rawX / this.zoomLevel) - this.viewportOffset.x);
        const y = this.snapToGrid((rawY / this.zoomLevel) - this.viewportOffset.y);

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const componentDef = COMPONENTS[data.category].items[data.component];

            if (componentDef) {
                // Save state for undo
                this.saveState();

                const id = this.nextId++;
                const name = this.generateComponentName(data.component);

                const newComponent = {
                    id: id,
                    name: name,
                    type: data.component,
                    category: data.category,
                    x: x,
                    y: y,
                    rotation: 0,
                    flippedX: false,
                    flippedY: false,
                    style: 'default',
                    label: '',
                    value: '',
                    def: componentDef
                };

                this.components.push(newComponent);

                // Try to insert on wire
                this.insertComponentOnWire(newComponent);

                this.selectComponent(newComponent);
                this.updateCode();
                this.render();

                this.showToast(`Added ${componentDef.name}`);
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    }

    insertComponentOnWire(comp) {
        // Only for bipoles with 2 terminals
        const terminals = this.getComponentTerminals(comp);
        if (terminals.length !== 2) return;

        // Check if center hits a wire
        const wire = this.getWireAt(comp.x, comp.y);
        if (!wire) return;

        // Get segment info
        const segment = this.getWireSegmentAt(comp.x, comp.y, wire);
        const isHorizontalSegment = segment === 'h' || segment === 'h1' || segment === 'h2';
        const isVerticalSegment = segment === 'v' || segment === 'v1' || segment === 'v2';

        // Check if component orientation matches segment
        const rotation = comp.rotation || 0;
        const isCompHorizontal = (rotation === 0 || rotation === 180);
        const isCompVertical = (rotation === 90 || rotation === 270);

        if ((isHorizontalSegment && isCompHorizontal) || (isVerticalSegment && isCompVertical)) {
            // Can insert!
            // Split wire into two: from wire.start to term1, and from term2 to wire.end
            const term1 = terminals[0];
            const term2 = terminals[1];

            // Determine which wire endpoint is closer to term1
            const d11 = Math.sqrt((wire.x1 - term1.x) ** 2 + (wire.y1 - term1.y) ** 2);
            const d22 = Math.sqrt((wire.x2 - term2.x) ** 2 + (wire.y2 - term2.y) ** 2);
            const d12 = Math.sqrt((wire.x1 - term2.x) ** 2 + (wire.y1 - term2.y) ** 2);
            const d21 = Math.sqrt((wire.x2 - term1.x) ** 2 + (wire.y2 - term1.y) ** 2);

            let w1Start, w2End;
            if (d11 + d22 < d12 + d21) {
                w1Start = { x: wire.x1, y: wire.y1 };
                w2End = { x: wire.x2, y: wire.y2 };
            } else {
                w1Start = { x: wire.x2, y: wire.y2 };
                w2End = { x: wire.x1, y: wire.y1 };
            }

            // Create new wires
            const wire1 = {
                id: this.nextId++,
                x1: w1Start.x, y1: w1Start.y,
                x2: term1.x, y2: term1.y,
                cornerMode: wire.cornerMode
            };
            const wire2 = {
                id: this.nextId++,
                x1: term2.x, y1: term2.y,
                x2: w2End.x, y2: w2End.y,
                cornerMode: wire.cornerMode
            };

            // Remove old wire, add new ones
            const idx = this.wires.indexOf(wire);
            if (idx > -1) {
                this.wires.splice(idx, 1);
                this.wires.push(wire1, wire2);
                this.showToast('Component inserted into wire');
            }
        }
    }

    splitWireAtPoint(wire, px, py) {
        const eps = 2;
        const isHorizontal = Math.abs(wire.y1 - wire.y2) < eps;
        const isVertical = Math.abs(wire.x1 - wire.x2) < eps;

        let w1, w2;

        if (isHorizontal || isVertical) {
            // Straight wire
            w1 = { id: this.nextId++, x1: wire.x1, y1: wire.y1, x2: px, y2: py, cornerMode: wire.cornerMode };
            w2 = { id: this.nextId++, x1: px, y1: py, x2: wire.x2, y2: wire.y2, cornerMode: wire.cornerMode };
        } else {
            // L-shaped wire split depends on cornerMode and where point is
            const mode = wire.cornerMode || 'hv';
            const cx = (mode === 'vh') ? wire.x1 : wire.x2;
            const cy = (mode === 'vh') ? wire.y2 : wire.y1;

            // Check if point is on first or second segment
            const ontoFirst = (mode === 'vh')
                ? (Math.abs(px - wire.x1) < eps) // vertical segment (x1,y1) to (x1,y2)
                : (Math.abs(py - wire.y1) < eps); // horizontal segment (x1,y1) to (x2,y1)

            if (ontoFirst) {
                // Split first segment: creates another L-shaped wire for the second part
                w1 = { id: this.nextId++, x1: wire.x1, y1: wire.y1, x2: px, y2: py, cornerMode: mode };
                w2 = { id: this.nextId++, x1: px, y1: py, x2: wire.x2, y2: wire.y2, cornerMode: mode };
            } else {
                // Split second segment
                w1 = { id: this.nextId++, x1: wire.x1, y1: wire.y1, x2: px, y2: py, cornerMode: mode };
                w2 = { id: this.nextId++, x1: px, y1: py, x2: wire.x2, y2: wire.y2, cornerMode: mode };
            }
        }

        const idx = this.wires.indexOf(wire);
        if (idx !== -1) {
            this.wires.splice(idx, 1);
            this.wires.push(w1, w2);
        }
    }

    getComponentAt(x, y) {
        // Search in reverse order (top components first)
        // Use padding for easier selection
        const padding = 10;

        for (let i = this.components.length - 1; i >= 0; i--) {
            const comp = this.components[i];
            const def = comp.def;
            const halfW = def.width / 2 + padding;
            const halfH = def.height / 2 + padding;

            if (x >= comp.x - halfW && x <= comp.x + halfW &&
                y >= comp.y - halfH && y <= comp.y + halfH) {
                return comp;
            }
        }
        return null;
    }

    getWireAt(x, y) {
        const threshold = 12; // Increased threshold for easier clicking

        for (let i = this.wires.length - 1; i >= 0; i--) {
            const wire = this.wires[i];
            const isHorizontal = Math.abs(wire.y1 - wire.y2) < 1;
            const isVertical = Math.abs(wire.x1 - wire.x2) < 1;

            if (isHorizontal || isVertical) {
                // Simple straight line
                const dist = this.pointToLineDistance(x, y, wire.x1, wire.y1, wire.x2, wire.y2);
                if (dist < threshold) {
                    return wire;
                }
            } else {
                // L-shaped wire - check both segments
                const mode = wire.cornerMode || 'hv';
                let dist1, dist2;

                if (mode === 'vh') {
                    // Vertical first (x1,y1) -> (x1,y2) -> (x2,y2)
                    dist1 = this.pointToLineDistance(x, y, wire.x1, wire.y1, wire.x1, wire.y2);
                    dist2 = this.pointToLineDistance(x, y, wire.x1, wire.y2, wire.x2, wire.y2);
                } else {
                    // Horizontal first (x1,y1) -> (x2,y1) -> (x2,y2)
                    dist1 = this.pointToLineDistance(x, y, wire.x1, wire.y1, wire.x2, wire.y1);
                    dist2 = this.pointToLineDistance(x, y, wire.x2, wire.y1, wire.x2, wire.y2);
                }

                if (dist1 < threshold || dist2 < threshold) {
                    return wire;
                }
            }
        }
        return null;
    }

    getWireSegmentAt(x, y, wire) {
        const isHorizontal = Math.abs(wire.y1 - wire.y2) < 1;
        const isVertical = Math.abs(wire.x1 - wire.x2) < 1;

        if (isHorizontal) return 'h';
        if (isVertical) return 'v';

        const mode = wire.cornerMode || 'hv';
        if (mode === 'vh') {
            const dV = this.pointToLineDistance(x, y, wire.x1, wire.y1, wire.x1, wire.y2);
            const dH = this.pointToLineDistance(x, y, wire.x1, wire.y2, wire.x2, wire.y2);
            return (dV < dH) ? 'v1' : 'h2';
        } else {
            const dH = this.pointToLineDistance(x, y, wire.x1, wire.y1, wire.x2, wire.y1);
            const dV = this.pointToLineDistance(x, y, wire.x2, wire.y1, wire.x2, wire.y2);
            return (dH < dV) ? 'h1' : 'v2';
        }
    }

    moveWireSegment(wire, segment, dx, dy) {
        const oldX1 = wire.x1, oldY1 = wire.y1;
        const oldX2 = wire.x2, oldY2 = wire.y2;

        if (segment === 'h') {
            wire.y1 += dy;
            wire.y2 += dy;
            this.moveConnectedWireEndpoints(oldX1, oldY1, wire.x1, wire.y1, wire);
            this.moveConnectedWireEndpoints(oldX2, oldY2, wire.x2, wire.y2, wire);
        } else if (segment === 'v') {
            wire.x1 += dx;
            wire.x2 += dx;
            this.moveConnectedWireEndpoints(oldX1, oldY1, wire.x1, wire.y1, wire);
            this.moveConnectedWireEndpoints(oldX2, oldY2, wire.x2, wire.y2, wire);
        } else if (segment === 'h1') {
            // mode 'hv': (x1,y1)->(x2,y1)->(x2,y2). h1 is y1.
            wire.y1 += dy;
            this.moveConnectedWireEndpoints(oldX1, oldY1, wire.x1, wire.y1, wire);
        } else if (segment === 'h2') {
            // mode 'vh': (x1,y1)->(x1,y2)->(x2,y2). h2 is y2.
            wire.y2 += dy;
            this.moveConnectedWireEndpoints(oldX2, oldY2, wire.x2, wire.y2, wire);
        } else if (segment === 'v1') {
            // mode 'vh': (x1,y1)->(x1,y2)->(x2,y2). v1 is x1.
            wire.x1 += dx;
            this.moveConnectedWireEndpoints(oldX1, oldY1, wire.x1, wire.y1, wire);
        } else if (segment === 'v2') {
            // mode 'hv': (x1,y1)->(x2,y1)->(x2,y2). v2 is x2.
            wire.x2 += dx;
            this.moveConnectedWireEndpoints(oldX2, oldY2, wire.x2, wire.y2, wire);
        }
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    selectComponent(component) {
        this.deselectAll();
        this.selectedComponent = component;
        this.updatePropertiesPanel();
    }

    selectWire(wire) {
        this.deselectAll();
        this.selectedWire = wire;
        this.updatePropertiesPanel();
    }

    deselectAll() {
        this.selectedComponent = null;
        this.selectedWire = null;
        this.updatePropertiesPanel();
    }

    updatePropertiesPanel() {
        const container = document.getElementById('propertiesContent');

        if (this.selectedComponent) {
            const comp = this.selectedComponent;
            const labelPos = comp.labelPosition || 'top';

            // Get unit options based on component category/type
            const unitOptions = this.getUnitOptionsForComponent(comp);
            const currentUnit = comp.valueUnit || unitOptions[0]?.value || '';

            const unitOptionsHtml = unitOptions.map(u =>
                `<option value="${u.value}" ${currentUnit === u.value ? 'selected' : ''}>${u.display}</option>`
            ).join('');

            container.innerHTML = `
                <div class="property-group">
                    <label>Component</label>
                    <input type="text" value="${comp.def.name}" disabled>
                </div>
                <div class="property-group">
                    <label>Label</label>
                    <input type="text" id="propLabel" value="${comp.label || ''}" placeholder="e.g. R1">
                </div>
                <div class="property-group">
                    <label>Label Position</label>
                    <select id="propLabelPos">
                        <option value="top" ${labelPos === 'top' ? 'selected' : ''}>Top</option>
                        <option value="bottom" ${labelPos === 'bottom' ? 'selected' : ''}>Bottom</option>
                        <option value="left" ${labelPos === 'left' ? 'selected' : ''}>Left</option>
                        <option value="right" ${labelPos === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                </div>
                <div class="property-group">
                    <label>Value</label>
                    <div class="value-input-row">
                        <input type="text" id="propValueNum" value="${comp.valueNum || ''}" placeholder="e.g. 1k" style="flex:1">
                        <select id="propValueUnit" style="width:70px">${unitOptionsHtml}</select>
                    </div>
                </div>
                <div class="property-row">
                    <div class="property-group">
                        <label>X</label>
                        <input type="number" id="propX" value="${comp.x}">
                    </div>
                    <div class="property-group">
                        <label>Y</label>
                        <input type="number" id="propY" value="${comp.y}">
                    </div>
                </div>
                <div class="property-group">
                    <select id="propRotation">
                        <option value="0" ${comp.rotation === 0 ? 'selected' : ''}>0°</option>
                        <option value="90" ${comp.rotation === 90 ? 'selected' : ''}>90° CW</option>
                        <option value="180" ${comp.rotation === 180 ? 'selected' : ''}>180°</option>
                        <option value="270" ${comp.rotation === 270 ? 'selected' : ''}>90° CCW</option>
                    </select>
                </div>
                ${(comp.def.category === 'sources' || comp.def.category === 'transistors' || comp.def.category === 'resistors') ? `
                <div class="property-group">
                    <label>Symbol Type</label>
                    <select id="propTypeSelector">
                        ${Object.entries(COMPONENTS[comp.def.category].items).map(([key, item]) =>
                `<option value="${key}" ${comp.type === key ? 'selected' : ''}>${item.name}</option>`
            ).join('')}
                    </select>
                </div>
                ` : ''}

                ${(comp.def.availableOptions && comp.def.availableOptions.length > 0) ? `
                <div class="property-group">
                    <label>Transistor Options</label>
                    <div class="transistor-options" id="transistorOptions">
                        ${comp.def.availableOptions.map(opt => `
                            <div class="option-with-dropdown">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="opt_${opt.replace(/\s+/g, '_')}" 
                                        ${(comp.transistorOptions || []).includes(opt) ? 'checked' : ''}>
                                    ${opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </label>
                                ${opt === 'bulk' ? `
                                <div class="option-dropdown" id="bulkConnectionGroup" style="display: ${(comp.transistorOptions || []).includes('bulk') ? 'block' : 'none'}; margin-left: 24px;">
                                    <select id="bulkConnection">
                                        <option value="S" ${comp.bulkConnection === 'S' || !comp.bulkConnection ? 'selected' : ''}>→ Source (S)</option>
                                        <option value="D" ${comp.bulkConnection === 'D' ? 'selected' : ''}>→ Drain (D)</option>
                                    </select>
                                </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${comp.def.depletionVariant ? `
                <div class="property-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="optDepletion" ${comp.depletion ? 'checked' : ''}>
                        Depletion Mode
                    </label>
                </div>
                ` : ''}

                <!-- Advanced Styling -->
                <div id="styleGroup" class="property-group" style="display: none;">
                    <label>Symbol Style</label>
                    <select id="compStyleSelect"></select>
                </div>

                <div class="property-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <button class="btn btn-secondary" id="flipHBtn" title="Flip Horizontal">Flip H</button>
                    <button class="btn btn-secondary" id="flipVBtn" title="Flip Vertical">Flip V</button>
                </div>
                <button class="btn btn-primary" style="width:100%;margin-top:12px" id="applyPropsBtn">
                    Apply Changes
                </button>
                <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="editor.deleteSelected()">
                    Delete Component
                </button>
            `;

            // Apply function
            const applyChanges = () => {
                comp.label = document.getElementById('propLabel').value;
                comp.labelPosition = document.getElementById('propLabelPos').value;
                comp.valueNum = document.getElementById('propValueNum').value;
                comp.valueUnit = document.getElementById('propValueUnit').value;
                if (document.getElementById('compStyleSelect')) {
                    comp.style = document.getElementById('compStyleSelect').value;
                }
                // Combine value and unit for display
                comp.value = comp.valueNum ? comp.valueNum + comp.valueUnit : '';
                this.render();
                this.updateCode();
            };

            // Event listeners - update on Enter key
            const onEnterKey = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyChanges();
                }
            };

            document.getElementById('propLabel').addEventListener('keydown', onEnterKey);
            document.getElementById('propValueNum').addEventListener('keydown', onEnterKey);
            document.getElementById('propValueUnit').addEventListener('change', applyChanges);
            document.getElementById('propLabelPos').addEventListener('change', applyChanges);
            document.getElementById('applyPropsBtn').addEventListener('click', applyChanges);

            document.getElementById('propX').addEventListener('change', (e) => {
                this.saveState();
                comp.x = parseInt(e.target.value);
                this.moveConnectedWires(comp, comp.x - parseInt(e.target.dataset.oldX || comp.x), 0);
                this.render();
                this.updateCode();
            });
            document.getElementById('propY').addEventListener('change', (e) => {
                this.saveState();
                comp.y = parseInt(e.target.value);
                this.render();
                this.updateCode();
            });
            document.getElementById('propRotation').addEventListener('change', (e) => {
                this.saveState();
                comp.rotation = parseInt(e.target.value);
                this.render();
                this.updateCode();
            });

            // Flip Logic
            document.getElementById('flipHBtn').onclick = () => {
                this.saveState();
                comp.flippedX = !comp.flippedX;
                this.render();
                this.updateCode();
            };
            document.getElementById('flipVBtn').onclick = () => {
                this.saveState();
                comp.flippedY = !comp.flippedY;
                this.render();
                this.updateCode();
            };

            // Style Logic
            const styleGroup = document.getElementById('styleGroup');
            const compStyleSelect = document.getElementById('compStyleSelect');
            const categoryData = COMPONENTS[comp.category];

            if (styleGroup && compStyleSelect && categoryData && categoryData.styles) {
                styleGroup.style.display = 'block';
                compStyleSelect.innerHTML = '';
                categoryData.styles.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
                    if (comp.style === s) opt.selected = true;
                    compStyleSelect.appendChild(opt);
                });
                compStyleSelect.onchange = applyChanges;
            }

            if (document.getElementById('propTypeSelector')) {
                document.getElementById('propTypeSelector').addEventListener('change', (e) => {
                    this.saveState();
                    const newType = e.target.value;
                    const category = comp.def.category;
                    const newDef = COMPONENTS[category].items[newType];
                    if (newDef) {
                        comp.type = newType;
                        comp.def = newDef;
                        comp.transistorOptions = []; // Reset options on type change
                        comp.depletion = false;
                        this.render();
                        this.updateCode();
                        this.updatePropertiesPanel();
                    }
                });
            }

            // Transistor options checkboxes
            if (comp.def.availableOptions && comp.def.availableOptions.length > 0) {
                comp.def.availableOptions.forEach(opt => {
                    const checkboxId = `opt_${opt.replace(/\s+/g, '_')}`;
                    const checkbox = document.getElementById(checkboxId);
                    if (checkbox) {
                        checkbox.addEventListener('change', (e) => {
                            this.saveState();
                            if (!comp.transistorOptions) comp.transistorOptions = [];
                            if (e.target.checked) {
                                if (!comp.transistorOptions.includes(opt)) {
                                    comp.transistorOptions.push(opt);
                                }
                                // If bulk is checked, set default connection and show dropdown
                                if (opt === 'bulk') {
                                    if (!comp.bulkConnection) comp.bulkConnection = 'S';
                                    const bulkGroup = document.getElementById('bulkConnectionGroup');
                                    if (bulkGroup) bulkGroup.style.display = 'block';
                                }
                            } else {
                                comp.transistorOptions = comp.transistorOptions.filter(o => o !== opt);
                                // If bulk is unchecked, hide dropdown
                                if (opt === 'bulk') {
                                    const bulkGroup = document.getElementById('bulkConnectionGroup');
                                    if (bulkGroup) bulkGroup.style.display = 'none';
                                }
                            }
                            this.render();
                            this.updateCode();
                        });
                    }
                });
            }

            // Bulk connection dropdown
            if (document.getElementById('bulkConnection')) {
                document.getElementById('bulkConnection').addEventListener('change', (e) => {
                    this.saveState();
                    comp.bulkConnection = e.target.value;
                    this.render();
                    this.updateCode();
                });
            }

            // Depletion mode checkbox
            if (document.getElementById('optDepletion')) {
                document.getElementById('optDepletion').addEventListener('change', (e) => {
                    this.saveState();
                    comp.depletion = e.target.checked;
                    this.render();
                    this.updateCode();
                });
            }
        } else if (this.selectedWire) {
            const wire = this.selectedWire;
            container.innerHTML = `
                <div class="property-group">
                    <label>Type</label>
                    <input type="text" value="Wire" disabled>
                </div>
                <div class="property-row">
                    <div class="property-group">
                        <label>Start X</label>
                        <input type="number" id="wireX1" value="${wire.x1}">
                    </div>
                    <div class="property-group">
                        <label>Start Y</label>
                        <input type="number" id="wireY1" value="${wire.y1}">
                    </div>
                </div>
                <div class="property-row">
                    <div class="property-group">
                        <label>End X</label>
                        <input type="number" id="wireX2" value="${wire.x2}">
                    </div>
                    <div class="property-group">
                        <label>End Y</label>
                        <input type="number" id="wireY2" value="${wire.y2}">
                    </div>
                </div>
                <button class="btn btn-secondary" style="width:100%;margin-top:16px" onclick="editor.deleteSelected()">
                    Delete Wire
                </button>
            `;

            // Wire coordinate editing
            ['wireX1', 'wireY1', 'wireX2', 'wireY2'].forEach(id => {
                document.getElementById(id).addEventListener('change', (e) => {
                    this.saveState();
                    const prop = id.replace('wire', '').toLowerCase();
                    wire[prop] = parseInt(e.target.value);
                    this.render();
                    this.updateCode();
                });
            });
        } else {
            container.innerHTML = `
                <div class="no-selection">
                    <p>Select a component to edit its properties</p>
                </div>
            `;
        }
    }

    getUnitOptionsForComponent(comp) {
        // Return unit options based on component type
        const category = comp.category;
        const type = comp.type;

        // Resistance units
        if (category === 'resistors' || type === 'resistor' || type === 'potentiometer' || type === 'photoresistor') {
            return [
                { value: 'Ω', display: 'Ω' },
                { value: 'mΩ', display: 'mΩ' },
                { value: 'kΩ', display: 'kΩ' },
                { value: 'MΩ', display: 'MΩ' }
            ];
        }

        // Capacitance units
        if (category === 'capacitors' || type === 'capacitor' || type === 'polarized_capacitor' || type === 'variable_capacitor') {
            return [
                { value: 'F', display: 'F' },
                { value: 'mF', display: 'mF' },
                { value: 'µF', display: 'µF' },
                { value: 'nF', display: 'nF' },
                { value: 'pF', display: 'pF' }
            ];
        }

        // Inductance units
        if (category === 'inductors' || type === 'inductor' || type === 'variable_inductor') {
            return [
                { value: 'H', display: 'H' },
                { value: 'mH', display: 'mH' },
                { value: 'µH', display: 'µH' },
                { value: 'nH', display: 'nH' }
            ];
        }

        // Voltage units
        if (category === 'sources' && (type.includes('voltage') || type === 'battery' || type === 'vcc' || type === 'vee')) {
            return [
                { value: 'V', display: 'V' },
                { value: 'mV', display: 'mV' },
                { value: 'kV', display: 'kV' }
            ];
        }

        // Current units
        if (category === 'sources' && type.includes('current')) {
            return [
                { value: 'A', display: 'A' },
                { value: 'mA', display: 'mA' },
                { value: 'µA', display: 'µA' },
                { value: 'nA', display: 'nA' }
            ];
        }

        // Default - no units
        return [
            { value: '', display: '-' }
        ];
    }

    rotateSelected(angle) {
        if (this.selectedComponent || this.selectedComponents.length > 0) {
            this.saveState();
            // We want 'positive' angle to be Clockwise for the user
            // Internally, TikZ is CCW, so we must be careful.
            // But if we just change the sign of the increment, it flips the UX.
            if (this.selectedComponents.length > 0) {
                this.selectedComponents.forEach(comp => {
                    comp.rotation = (comp.rotation - angle + 360) % 360;
                });
            } else {
                this.selectedComponent.rotation = (this.selectedComponent.rotation - angle + 360) % 360;
            }
            this.updatePropertiesPanel();
            this.updateCode();
            this.render();
        }
    }

    deleteSelected() {
        const hasSelection = this.selectedComponent || this.selectedWire ||
            this.selectedComponents.length > 0 || this.selectedWires.length > 0;

        if (!hasSelection) return;

        this.saveState();

        // Handle multi-select
        if (this.selectedComponents.length > 0) {
            this.selectedComponents.forEach(comp => {
                this.components = this.components.filter(c => c !== comp);
            });
            this.selectedComponents = [];
        }
        if (this.selectedWires.length > 0) {
            this.selectedWires.forEach(wire => {
                this.wires = this.wires.filter(w => w !== wire);
            });
            this.selectedWires = [];
        }

        // Handle single-select
        if (this.selectedComponent) {
            this.components = this.components.filter(c => c !== this.selectedComponent);
            this.selectedComponent = null;
        }
        if (this.selectedWire) {
            this.wires = this.wires.filter(w => w !== this.selectedWire);
            this.selectedWire = null;
        }

        this.updatePropertiesPanel();
        this.updateCode();
        this.render();
    }

    copySelected() {
        const selection = {
            components: [],
            wires: []
        };

        // Add single-selected items
        if (this.selectedComponent) selection.components.push(JSON.parse(JSON.stringify(this.selectedComponent)));
        if (this.selectedWire) selection.wires.push(JSON.parse(JSON.stringify(this.selectedWire)));

        // Add multi-selected items
        this.selectedComponents.forEach(comp => {
            if (!selection.components.some(c => c.id === comp.id)) {
                selection.components.push(JSON.parse(JSON.stringify(comp)));
            }
        });
        this.selectedWires.forEach(wire => {
            if (!selection.wires.some(w => w.id === wire.id)) {
                selection.wires.push(JSON.parse(JSON.stringify(wire)));
            }
        });

        if (selection.components.length > 0 || selection.wires.length > 0) {
            this.clipboard = selection;
            this.showToast('Copied to clipboard');
        }
    }

    cutSelected() {
        this.copySelected();
        if (this.clipboard) {
            this.deleteSelected();
            this.showToast('Cut to clipboard');
        }
    }

    paste() {
        if (!this.clipboard) return;

        this.saveState();

        const offset = 20;
        const newComponents = [];
        const idMap = new Map(); // oldId -> newId

        // Paste components
        this.clipboard.components.forEach(compData => {
            const newComp = JSON.parse(JSON.stringify(compData));
            const oldId = newComp.id;
            newComp.id = this.nextId++;
            newComp.name = this.generateComponentName(newComp.type);
            newComp.x += offset;
            newComp.y += offset;
            idMap.set(oldId, newComp.id);
            this.components.push(newComp);
            newComponents.push(newComp);
        });

        // Paste wires
        this.clipboard.wires.forEach(wireData => {
            const newWire = JSON.parse(JSON.stringify(wireData));
            newWire.id = this.nextId++;
            newWire.x1 += offset;
            newWire.y1 += offset;
            newWire.x2 += offset;
            newWire.y2 += offset;
            this.wires.push(newWire);
        });

        // Select the newly pasted items
        this.deselectAll();
        if (newComponents.length === 1) {
            this.selectedComponent = newComponents[0];
        } else if (newComponents.length > 1) {
            this.selectedComponents = newComponents;
        }

        this.render();
        this.updateCode();
        this.showToast('Pasted');
    }

    fitView() {
        if (this.components.length === 0 && this.wires.length === 0) return;

        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        this.components.forEach(c => {
            const w = c.def.width || 40;
            const h = c.def.height || 40;
            minX = Math.min(minX, c.x - w / 2);
            maxX = Math.max(maxX, c.x + w / 2);
            minY = Math.min(minY, c.y - h / 2);
            maxY = Math.max(maxY, c.y + h / 2);
        });

        this.wires.forEach(w => {
            minX = Math.min(minX, w.x1, w.x2);
            maxX = Math.max(maxX, w.x1, w.x2);
            minY = Math.min(minY, w.y1, w.y2);
            maxY = Math.max(maxY, w.y1, w.y2);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const padding = 100;
        const contentWidth = (maxX - minX) + padding;
        const contentHeight = (maxY - minY) + padding;

        const wrapperRect = this.canvasWrapper.getBoundingClientRect();
        const zoomX = wrapperRect.width / contentWidth;
        const zoomY = wrapperRect.height / contentHeight;

        this.zoomLevel = Math.min(1.5, Math.max(0.5, Math.min(zoomX, zoomY)));

        // Update zoom select if exists
        const zoomSelect = document.getElementById('zoomSelect');
        if (zoomSelect) {
            // Find closest match or keep current
            zoomSelect.value = this.zoomLevel.toFixed(1);
        }

        this.viewportOffset.x = -centerX + (wrapperRect.width / 2) / this.zoomLevel;
        this.viewportOffset.y = -centerY + (wrapperRect.height / 2) / this.zoomLevel;

        this.setupCanvas();
        this.render();
        this.showToast('View fitted to circuit');
    }

    centerAtOrigin() {
        if (this.components.length === 0 && this.wires.length === 0) return;

        this.saveState();

        // Calculate center of current elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.components.forEach(c => {
            minX = Math.min(minX, c.x);
            maxX = Math.max(maxX, c.x);
            minY = Math.min(minY, c.y);
            maxY = Math.max(maxY, c.y);
        });
        this.wires.forEach(w => {
            minX = Math.min(minX, w.x1, w.x2);
            maxX = Math.max(maxX, w.x1, w.x2);
            minY = Math.min(minY, w.y1, w.y2);
            maxY = Math.max(maxY, w.y1, w.y2);
        });

        const centerX = this.snapToGrid((minX + maxX) / 2);
        const centerY = this.snapToGrid((minY + maxY) / 2);

        // Displace everything
        this.components.forEach(c => {
            c.x -= centerX;
            c.y -= centerY;
        });

        this.wires.forEach(w => {
            w.x1 -= centerX;
            w.y1 -= centerY;
            w.x2 -= centerX;
            w.y2 -= centerY;
        });

        this.render();
        this.updateCode();
        this.showToast('Circuit centered at origin');
    }

    clearAll() {
        if (this.components.length === 0 && this.wires.length === 0) {
            this.showToast('Canvas is already empty');
            return;
        }

        // Clear without confirmation for better UX
        this.components = [];
        this.wires = [];
        this.selectedComponent = null;
        this.selectedWire = null;
        this.nextId = 1;
        this.updatePropertiesPanel();
        this.updateCode();
        this.render();
        this.showToast('Canvas cleared');
    }

    testAllComponents() {
        this.clearAll();

        let x = 0, y = 0;
        const colWidth = 120;
        const rowHeight = 80;
        let maxColItems = 5;
        let col = 0;

        // Iterate through all component categories
        for (const [categoryKey, category] of Object.entries(COMPONENTS)) {
            for (const [itemKey, item] of Object.entries(category.items)) {
                const comp = {
                    id: this.nextId++,
                    type: itemKey,
                    def: item,
                    name: this.generateComponentName(itemKey),
                    x: x,
                    y: y,
                    rotation: 0,
                    label: '',
                    value: '',
                    flippedX: false,
                    flippedY: false,
                    style: 'default'
                };
                this.components.push(comp);

                col++;
                x += colWidth;
                if (col >= maxColItems) {
                    col = 0;
                    x = 0;
                    y += rowHeight;
                }
            }
        }

        this.render();
        this.updateCode();
        this.fitView();
        this.showToast(`Placed ${this.components.length} components`);
    }

    onWheel(e) {
        e.preventDefault();

        // Get mouse position in canvas coordinates
        const rect = this.mainCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate world position before zoom
        const worldXBefore = mouseX / this.zoomLevel - this.viewportOffset.x;
        const worldYBefore = mouseY / this.zoomLevel - this.viewportOffset.y;

        // Adjust zoom level
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.min(2.0, Math.max(0.25, this.zoomLevel * zoomDelta));
        this.zoomLevel = newZoom;

        // Calculate world position after zoom and adjust offset to keep mouse position fixed
        const worldXAfter = mouseX / this.zoomLevel - this.viewportOffset.x;
        const worldYAfter = mouseY / this.zoomLevel - this.viewportOffset.y;

        this.viewportOffset.x += worldXAfter - worldXBefore;
        this.viewportOffset.y += worldYAfter - worldYBefore;

        // Update zoom select dropdown
        const zoomSelect = document.getElementById('zoomSelect');
        if (zoomSelect) {
            // Find closest option
            const options = Array.from(zoomSelect.options).map(o => parseFloat(o.value));
            const closest = options.reduce((a, b) =>
                Math.abs(b - this.zoomLevel) < Math.abs(a - this.zoomLevel) ? b : a
            );
            zoomSelect.value = closest.toFixed(1);
        }

        this.setupCanvas();
        this.render();
    }

    onKeyDown(e) {
        // Don't handle shortcuts when focused on inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Handle Ctrl+Z (undo) and Ctrl+Y (redo)
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.undo();
                return;
            }
            if (e.key.toLowerCase() === 'y') {
                e.preventDefault();
                this.redo();
                return;
            }

            // Ctrl keys for Copy/Cut/Paste
            if (e.key.toLowerCase() === 'c') {
                e.preventDefault();
                this.copySelected();
                return;
            } else if (e.key.toLowerCase() === 'x') {
                e.preventDefault();
                this.cutSelected();
                return;
            } else if (e.key.toLowerCase() === 'v') {
                e.preventDefault();
                this.paste();
                return;
            }
        }

        switch (e.key.toLowerCase()) {
            case 'v':
                this.setTool('select');
                break;
            case 'w':
                this.setTool('wire');
                break;
            case 'q':
                this.rotateSelected(-90);
                break;
            case 'e':
                this.rotateSelected(90);
                break;
            case 'delete':
            case 'backspace':
                e.preventDefault();
                this.deleteSelected();
                break;
            case 'h':
                this.flipSelected('h');
                break;
            case 'v':
                this.flipSelected('v');
                break;
            case 'escape':
                this.deselectAll();
                this.isDrawingWire = false;
                this.wireStart = null;
                this.render();
                break;
        }
    }

    filterComponents(query) {
        const items = document.querySelectorAll('.component-item');
        const categories = document.querySelectorAll('.category');

        query = query.toLowerCase().trim();

        if (!query) {
            items.forEach(item => item.style.display = '');
            categories.forEach(cat => cat.style.display = '');
            return;
        }

        categories.forEach(cat => {
            let hasVisibleItems = false;
            const catItems = cat.querySelectorAll('.component-item');

            catItems.forEach(item => {
                const name = item.querySelector('.name').textContent.toLowerCase();
                const visible = name.includes(query);
                item.style.display = visible ? '' : 'none';
                if (visible) hasVisibleItems = true;
            });

            cat.style.display = hasVisibleItems ? '' : 'none';
            if (hasVisibleItems) cat.classList.remove('collapsed');
        });
    }

    render() {
        const ctx = this.ctx;
        const width = this.mainCanvas.width;
        const height = this.mainCanvas.height;

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.scale(this.zoomLevel, this.zoomLevel);
        ctx.translate(this.viewportOffset.x, this.viewportOffset.y);

        // Calculate junction points (where 3+ wires meet)
        const junctions = this.findJunctions();

        // Draw wires
        this.wires.forEach(wire => {
            ctx.beginPath();
            ctx.moveTo(wire.x1, wire.y1);

            // Check if orthogonal or L-shaped
            const isHorizontal = Math.abs(wire.y1 - wire.y2) < 1;
            const isVertical = Math.abs(wire.x1 - wire.x2) < 1;

            if (isHorizontal || isVertical) {
                // Straight line
                ctx.lineTo(wire.x2, wire.y2);
            } else {
                // L-shaped wire based on cornerMode
                const mode = wire.cornerMode || 'hv';
                if (mode === 'vh') {
                    // Vertical first, then horizontal (|-)
                    ctx.lineTo(wire.x1, wire.y2);
                    ctx.lineTo(wire.x2, wire.y2);
                } else {
                    // Horizontal first, then vertical (-|)
                    ctx.lineTo(wire.x2, wire.y1);
                    ctx.lineTo(wire.x2, wire.y2);
                }
            }

            const isSelected = wire === this.selectedWire || this.selectedWires.includes(wire);
            ctx.strokeStyle = isSelected ? '#58a6ff' : '#8b949e';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.stroke();
        });

        // Draw junction dots only at true junctions (3+ wires meeting)
        junctions.forEach(junc => {
            ctx.beginPath();
            ctx.arc(junc.x, junc.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f0f6fc';
            ctx.fill();
        });

        // Draw wire endpoints only when hovered or selected (for dragging)
        if (this.currentTool === 'select') {
            this.wires.forEach(wire => {
                const isHovered1 = this.hoveredWireEndpoint &&
                    this.hoveredWireEndpoint.wire === wire &&
                    this.hoveredWireEndpoint.endpoint === 1;
                const isHovered2 = this.hoveredWireEndpoint &&
                    this.hoveredWireEndpoint.wire === wire &&
                    this.hoveredWireEndpoint.endpoint === 2;
                const isSelected = wire === this.selectedWire;

                if (isHovered1 || isSelected) {
                    ctx.beginPath();
                    ctx.arc(wire.x1, wire.y1, isHovered1 ? 6 : 4, 0, Math.PI * 2);
                    ctx.fillStyle = isHovered1 ? '#3fb950' : '#58a6ff';
                    ctx.fill();
                }
                if (isHovered2 || isSelected) {
                    ctx.beginPath();
                    ctx.arc(wire.x2, wire.y2, isHovered2 ? 6 : 4, 0, Math.PI * 2);
                    ctx.fillStyle = isHovered2 ? '#3fb950' : '#58a6ff';
                    ctx.fill();
                }
            });
        }

        // Draw wire preview with terminal snapping
        if (this.isDrawingWire && this.wireStart) {
            const endSnap = this.snapToTerminalOrGrid(this.mousePos.x, this.mousePos.y);
            ctx.beginPath();
            ctx.moveTo(this.wireStart.x, this.wireStart.y);

            // Preview L-shaped wires based on starting orientation
            const isHorizontal = Math.abs(this.wireStart.y - endSnap.y) < 1;
            const isVertical = Math.abs(this.wireStart.x - endSnap.x) < 1;

            if (isHorizontal || isVertical) {
                ctx.lineTo(endSnap.x, endSnap.y);
            } else {
                // Determine corner mode based on starting orientation
                let useVerticalFirst = false;
                if (this.wireStartInfo && this.wireStartInfo.snappedToTerminal) {
                    const comp = this.components.find(c => c.id === this.wireStartInfo.terminal.componentId);
                    if (comp && (comp.rotation === 90 || comp.rotation === 270)) {
                        useVerticalFirst = true;
                    }
                } else if (this.wireStartInfo && this.wireStartInfo.snappedToWireEnd) {
                    const sourceWire = this.wireStartInfo.wireEnd.wire;
                    const isSourceVertical = Math.abs(sourceWire.x1 - sourceWire.x2) < 2;
                    if (isSourceVertical) {
                        useVerticalFirst = true;
                    }
                }

                if (useVerticalFirst) {
                    // Vertical first, then horizontal (|-)
                    ctx.lineTo(this.wireStart.x, endSnap.y);
                    ctx.lineTo(endSnap.x, endSnap.y);
                } else {
                    // Horizontal first, then vertical (-|)
                    ctx.lineTo(endSnap.x, this.wireStart.y);
                    ctx.lineTo(endSnap.x, endSnap.y);
                }
            }

            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw snap indicator at end
            if (endSnap.snappedToTerminal || endSnap.snappedToWireEnd) {
                ctx.beginPath();
                ctx.arc(endSnap.x, endSnap.y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#3fb950';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Draw components
        this.components.forEach(comp => {
            ctx.save();
            ctx.translate(comp.x, comp.y);
            ctx.rotate(-comp.rotation * Math.PI / 180); // Negative for CCW (match TikZ)

            // Draw the component using canvas commands
            this.drawComponent(ctx, comp);

            // Hover highlight (subtle glow when about to select)
            if (comp === this.hoveredComponent && comp !== this.selectedComponent) {
                ctx.strokeStyle = 'rgba(88, 166, 255, 0.5)';
                ctx.lineWidth = 2;
                const padding = 8;
                ctx.strokeRect(
                    -comp.def.width / 2 - padding,
                    -comp.def.height / 2 - padding,
                    comp.def.width + padding * 2,
                    comp.def.height + padding * 2
                );
            }

            // Selection highlight (single or multi)
            const isSelected = comp === this.selectedComponent || this.selectedComponents.includes(comp);
            if (isSelected) {
                ctx.strokeStyle = '#58a6ff';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                const padding = 8;
                ctx.strokeRect(
                    -comp.def.width / 2 - padding,
                    -comp.def.height / 2 - padding,
                    comp.def.width + padding * 2,
                    comp.def.height + padding * 2
                );
                ctx.setLineDash([]);
            }

            ctx.restore();

            // Draw label and value based on position
            this.drawComponentLabel(ctx, comp);

            // Draw terminal points when in wire mode
            if (this.currentTool === 'wire') {
                const terminals = this.getComponentTerminals(comp);
                terminals.forEach(term => {
                    const isHovered = this.hoveredTerminal &&
                        this.hoveredTerminal.componentId === comp.id &&
                        this.hoveredTerminal.terminalIndex === term.terminalIndex;

                    ctx.beginPath();
                    ctx.arc(term.x, term.y, isHovered ? 7 : 5, 0, Math.PI * 2);
                    ctx.fillStyle = isHovered ? '#3fb950' : '#58a6ff';
                    ctx.fill();

                    // Draw outer ring
                    ctx.beginPath();
                    ctx.arc(term.x, term.y, isHovered ? 10 : 7, 0, Math.PI * 2);
                    ctx.strokeStyle = isHovered ? '#3fb950' : '#58a6ff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
            }
        });

        // Draw area selection rectangle
        if (this.isAreaSelecting && this.areaSelectStart && this.areaSelectEnd) {
            const x = Math.min(this.areaSelectStart.x, this.areaSelectEnd.x);
            const y = Math.min(this.areaSelectStart.y, this.areaSelectEnd.y);
            const w = Math.abs(this.areaSelectEnd.x - this.areaSelectStart.x);
            const h = Math.abs(this.areaSelectEnd.y - this.areaSelectStart.y);

            ctx.fillStyle = 'rgba(88, 166, 255, 0.1)';
            ctx.fillRect(x, y, w, h);

            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
        }
        ctx.restore();
    }

    drawComponentLabel(ctx, comp) {
        if (!comp.label && !comp.value) return;

        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const position = comp.labelPosition || 'top';
        const halfW = comp.def.width / 2;
        const halfH = comp.def.height / 2;
        const offset = 15;

        let labelX = comp.x;
        let labelY = comp.y;
        let valueX = comp.x;
        let valueY = comp.y;

        switch (position) {
            case 'top':
                labelY = comp.y - halfH - offset;
                valueY = labelY - 14;
                break;
            case 'bottom':
                labelY = comp.y + halfH + offset;
                valueY = labelY + 14;
                break;
            case 'left':
                ctx.textAlign = 'right';
                labelX = comp.x - halfW - offset;
                valueX = labelX;
                valueY = labelY + 14;
                break;
            case 'right':
                ctx.textAlign = 'left';
                labelX = comp.x + halfW + offset;
                valueX = labelX;
                valueY = labelY + 14;
                break;
        }

        if (comp.label) {
            ctx.fillStyle = '#58a6ff';
            ctx.fillText(comp.label, labelX, labelY);
        }

        if (comp.value) {
            ctx.fillStyle = '#8b949e';
            ctx.fillText(comp.value, valueX, valueY);
        }
    }

    findJunctions() {
        // Find junction points where wires truly connect in a T or cross pattern
        const junctions = [];
        const eps = 2;

        const pointsToCheck = new Set();

        // Collect all wire endpoints and corners
        this.wires.forEach(wire => {
            pointsToCheck.add(`${wire.x1},${wire.y1}`);
            pointsToCheck.add(`${wire.x2},${wire.y2}`);

            // Add corners for L-shaped wires
            const isHorizontal = Math.abs(wire.y1 - wire.y2) < eps;
            const isVertical = Math.abs(wire.x1 - wire.x2) < eps;
            if (!isHorizontal && !isVertical) {
                const mode = wire.cornerMode || 'hv';
                if (mode === 'vh') {
                    pointsToCheck.add(`${wire.x1},${wire.y2}`);
                } else {
                    pointsToCheck.add(`${wire.x2},${wire.y1}`);
                }
            }
        });

        // Collect all terminal points
        this.components.forEach(comp => {
            const terminals = this.getComponentTerminals(comp);
            terminals.forEach(term => {
                pointsToCheck.add(`${term.x},${term.y}`);
            });
        });

        // For each point, count connected segments
        for (const pointKey of pointsToCheck) {
            const [px, py] = pointKey.split(',').map(Number);
            let connectionCount = 0;
            let hasMidHit = false;

            // Count wires
            this.wires.forEach(wire => {
                const isEndpoint1 = Math.abs(wire.x1 - px) < eps && Math.abs(wire.y1 - py) < eps;
                const isEndpoint2 = Math.abs(wire.x2 - px) < eps && Math.abs(wire.y2 - py) < eps;

                // Check if this point is the corner of an L-shaped wire
                let isCornerEndpoint = false;
                const isHorizontal = Math.abs(wire.y1 - wire.y2) < eps;
                const isVertical = Math.abs(wire.x1 - wire.x2) < eps;
                if (!isHorizontal && !isVertical) {
                    const mode = wire.cornerMode || 'hv';
                    const cx = (mode === 'vh') ? wire.x1 : wire.x2;
                    const cy = (mode === 'vh') ? wire.y2 : wire.y1;
                    if (Math.abs(cx - px) < eps && Math.abs(cy - py) < eps) {
                        isCornerEndpoint = true;
                    }
                }

                if (isEndpoint1 || isEndpoint2 || isCornerEndpoint) {
                    connectionCount++;
                } else if (this.isPointOnWire(px, py, wire)) {
                    connectionCount++;
                    hasMidHit = true;
                }
            });

            // Count terminals
            let connectedToTerminal = false;
            this.components.forEach(comp => {
                const terminals = this.getComponentTerminals(comp);
                terminals.forEach(term => {
                    if (Math.abs(term.x - px) < eps && Math.abs(term.y - py) < eps) {
                        connectionCount++;
                        connectedToTerminal = true;
                    }
                });
            });

            // Junction if:
            // 1. 3+ total connections (at least 3 wires, or 2 wires + 1 terminal, etc.)
            // 2. OR 2 connections where at least one is a T-junction (mid-hit)
            if (connectionCount >= 3 || (connectionCount >= 2 && hasMidHit)) {
                junctions.push({ x: px, y: py });
            }
        }

        return junctions;
    }

    isPointOnWire(px, py, wire) {
        const eps = 2;

        // For L-shaped wires, check both segments based on cornerMode
        const isHorizontal = Math.abs(wire.y1 - wire.y2) < eps;
        const isVertical = Math.abs(wire.x1 - wire.x2) < eps;

        if (isHorizontal) {
            // Horizontal line
            if (Math.abs(py - wire.y1) < eps) {
                const minX = Math.min(wire.x1, wire.x2);
                const maxX = Math.max(wire.x1, wire.x2);
                if (px > minX + eps / 2 && px < maxX - eps / 2) {
                    return true;
                }
            }
        } else if (isVertical) {
            // Vertical line
            if (Math.abs(px - wire.x1) < eps) {
                const minY = Math.min(wire.y1, wire.y2);
                const maxY = Math.max(wire.y1, wire.y2);
                if (py > minY + eps / 2 && py < maxY - eps / 2) {
                    return true;
                }
            }
        } else {
            // L-shaped wire based on cornerMode
            const mode = wire.cornerMode || 'hv';

            if (mode === 'vh') {
                // Vertical first (x1,y1) -> (x1,y2) -> (x2,y2)
                // Check vertical segment
                if (Math.abs(px - wire.x1) < eps) {
                    const minY = Math.min(wire.y1, wire.y2);
                    const maxY = Math.max(wire.y1, wire.y2);
                    if (py > minY + eps / 2 && py < maxY - eps / 2) {
                        return true;
                    }
                }
                // Check horizontal segment
                if (Math.abs(py - wire.y2) < eps) {
                    const minX = Math.min(wire.x1, wire.x2);
                    const maxX = Math.max(wire.x1, wire.x2);
                    if (px > minX + eps / 2 && px < maxX - eps / 2) {
                        return true;
                    }
                }
            } else {
                // Horizontal first (x1,y1) -> (x2,y1) -> (x2,y2)
                // Check horizontal segment
                if (Math.abs(py - wire.y1) < eps) {
                    const minX = Math.min(wire.x1, wire.x2);
                    const maxX = Math.max(wire.x1, wire.x2);
                    if (px > minX + eps / 2 && px < maxX - eps / 2) {
                        return true;
                    }
                }
                // Check vertical segment
                if (Math.abs(px - wire.x2) < eps) {
                    const minY = Math.min(wire.y1, wire.y2);
                    const maxY = Math.max(wire.y1, wire.y2);
                    if (py > minY + eps / 2 && py < maxY - eps / 2) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    drawComponent(ctx, comp) {
        ctx.save();
        ctx.strokeStyle = '#f0f6fc';
        ctx.fillStyle = '#f0f6fc';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const def = comp.def;
        if (!def || !def.svg) {
            ctx.strokeRect(-20, -10, 40, 20);
            ctx.restore();
            return;
        }

        if (comp.flippedX) ctx.scale(-1, 1);
        if (comp.flippedY) ctx.scale(1, -1);

        try {
            // Paths
            const dMatches = def.svg.match(/d="([^"]+)"/g);
            if (dMatches) {
                dMatches.forEach(match => {
                    const d = match.match(/d="([^"]+)"/)[1];
                    const path = new Path2D(d);
                    const seg = def.svg.substring(def.svg.indexOf(d) - 50, def.svg.indexOf(d) + d.length + 50);
                    if (seg.includes('fill="currentColor"') || seg.includes('fill="#')) ctx.fill(path);
                    if (!seg.includes('fill="currentColor"') || seg.includes('stroke="currentColor"')) ctx.stroke(path);
                });
            }

            // Circles
            const circleMatches = def.svg.match(/<circle ([^>]+)>/g);
            if (circleMatches) {
                circleMatches.forEach(c => {
                    const cx = parseFloat(c.match(/cx="([^"]+)"/)[1]);
                    const cy = parseFloat(c.match(/cy="([^"]+)"/)[1]);
                    const r = parseFloat(c.match(/r="([^"]+)"/)[1]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    if (c.includes('fill="none"')) ctx.stroke();
                    else ctx.fill();
                });
            }

            // Polygons
            const polyMatches = def.svg.match(/<polygon ([^>]+)>/g);
            if (polyMatches) {
                polyMatches.forEach(p => {
                    const pointsStr = p.match(/points="([^"]+)"/)[1];
                    const pts = pointsStr.trim().split(/\s+/).map(pt => pt.split(',').map(Number));
                    ctx.beginPath();
                    ctx.moveTo(pts[0][0], pts[0][1]);
                    for (let i = 1; i < pts.length; i++) if (pts[i]) ctx.lineTo(pts[i][0], pts[i][1]);
                    ctx.closePath();
                    if (p.includes('fill="none"')) ctx.stroke();
                    else ctx.fill();
                });
            }

            // Rects
            const rectMatches = def.svg.match(/<rect ([^>]+)>/g);
            if (rectMatches) {
                rectMatches.forEach(r => {
                    const x = parseFloat(r.match(/x="([^"]+)"/)[1]);
                    const y = parseFloat(r.match(/y="([^"]+)"/)[1]);
                    const w = parseFloat(r.match(/width="([^"]+)"/)[1]);
                    const h = parseFloat(r.match(/height="([^"]+)"/)[1]);
                    if (r.includes('fill="none"')) ctx.strokeRect(x, y, w, h);
                    else ctx.fillRect(x, y, w, h);
                });
            }

            // Text
            const textMatches = def.svg.match(/<text ([^>]+)>([^<]+)<\/text>/g);
            if (textMatches) {
                textMatches.forEach(t => {
                    const x = parseFloat(t.match(/x="([^"]+)"/)[1]);
                    const y = parseFloat(t.match(/y="([^"]+)"/)[1]);
                    const content = t.match(/>([^<]+)<\/text/)[1];
                    ctx.font = t.includes('font-weight="bold"') ? 'bold 15px Arial' : '15px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(content, x, y);
                });
            }
        } catch (e) {
            console.error(e);
        }

        ctx.restore();
    }

    updateCode() {
        const code = this.generateCircuitikzCode();
        // Highlight lines for selected elements
        const lines = code.split('\n');
        const highlightedLines = lines.map((line, idx) => {
            // Check if this line corresponds to selected component or wire
            let isHighlighted = false;
            if (this.selectedComponent && this.componentLineIndices && this.componentLineIndices[this.selectedComponent.id] === idx) {
                isHighlighted = true;
            }
            if (this.selectedWire && this.wireLineIndices && this.wireLineIndices[this.selectedWire.id] === idx) {
                isHighlighted = true;
            }

            if (isHighlighted) {
                return `<span style="background-color: rgba(88, 166, 255, 0.3); display: block;">${this.escapeHtml(line)}</span>`;
            }
            return this.escapeHtml(line);
        });
        document.getElementById('codeOutput').innerHTML = `<code>${highlightedLines.join('\n')}</code>`;
    }

    generateCircuitikzCode() {
        if (this.components.length === 0 && this.wires.length === 0) {
            this.componentLineIndices = {};
            this.wireLineIndices = {};
            return `\\begin{circuitikz}[american]\n  % Add components to generated code\n\\end{circuitikz}`;
        }

        const scale = 40; // 20px (grid) = 0.5 units
        let lines = [];
        this.componentLineIndices = {};
        this.wireLineIndices = {};

        lines.push('\\begin{circuitikz}[american]');
        // Set standard heights/widths for all tripoles to ensure grid alignment
        lines.push(`    \\ctikzset{tripoles/nmos/height=2.0, tripoles/nmos/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/pmos/height=2.0, tripoles/pmos/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/npn/height=2.0, tripoles/npn/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/pnp/height=2.0, tripoles/pnp/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/nfet/height=2.0, tripoles/nfet/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/pfet/height=2.0, tripoles/pfet/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/nfetd/height=2.0, tripoles/nfetd/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/pfetd/height=2.0, tripoles/pfetd/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/njfet/height=2.0, tripoles/njfet/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/pjfet/height=2.0, tripoles/pjfet/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/hemt/height=2.0, tripoles/hemt/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/nigbt/height=2.0, tripoles/nigbt/width=1.0}`);
        lines.push(`    \\ctikzset{tripoles/pigbt/height=2.0, tripoles/pigbt/width=1.0}`);

        lines.push('  \\ctikzset{monopoles/vcc/arrow={Triangle[open, length=8pt, width=14pt]}}');
        lines.push('  \\ctikzset{monopoles/vee/arrow={Triangle[open, length=8pt, width=14pt]}}');

        // 1. Map world coordinates to component anchors for easy lookup
        // Only for node-based components (not bipoles drawn with to[...] syntax)
        const terminalMap = new Map(); // "x,y" -> "CompName.anchor"

        // List of bipole types that use path-based drawing (to[...] syntax)
        // These don't create named nodes, so we can't use anchor references
        const bipoleTypesList = [
            'resistor', 'varResistor', 'potentiometer',
            'capacitor', 'polarCap', 'varCapacitor', 'curvedCap', 'capSensor', 'piezoelectric', 'cpe', 'ferroCap',
            'inductor',
            'vsource', 'isource', 'battery', 'vsourceAC',
            'diode', 'zener', 'led', 'photodiode',
            'fuse', 'lamp', 'ammeter', 'voltmeter',
            'switchOpen', 'pushButton'
        ];

        this.components.forEach(comp => {
            // Skip bipoles - they don't create named nodes
            if (bipoleTypesList.includes(comp.type)) {
                return;
            }

            // Flipped components are now supported because we place the nodes 
            // at their terminal coordinates using anchors, ensuring alignment.

            const terminals = this.getComponentTerminals(comp);
            const def = comp.def;
            terminals.forEach((term, idx) => {
                const anchor = def.terminals[idx].anchor;
                // If no anchor specified (or empty), just use node name
                // Otherwise use CompName.anchor format
                const ref = anchor ? `${comp.name}.${anchor}` : comp.name;
                terminalMap.set(`${term.x},${term.y}`, ref);
            });
        });

        // 2. Generate component nodes
        this.components.forEach(comp => {
            const def = comp.def;

            let nodeOptions = [];
            let usePath = false; // Use path-based drawing for bipoles
            let pathComponent = ''; // The path component key

            // Determine if this is a bipole that needs path-based drawing
            // All two-terminal passive components must use `to[component]` syntax
            const bipoleTypes = {
                'resistor': () => comp.style === 'european' ? 'R, european resistor' : 'R',
                'varResistor': () => 'vR',
                'potentiometer': () => 'pR',
                'capacitor': () => 'C',
                'polarCap': () => 'eC',  // electrolytic capacitor
                'varCapacitor': () => 'vC',  // variable capacitor
                'curvedCap': () => 'cC',  // curved (polarized) capacitor
                'capSensor': () => 'sC',  // capacitive sensor
                'piezoelectric': () => 'PZ',  // piezoelectric element
                'cpe': () => 'cpe',  // constant phase element
                'ferroCap': () => 'feC',  // ferroelectric capacitor
                'inductor': () => 'L',
                'vsource': () => 'vsource',
                'isource': () => 'isource',
                'battery': () => 'battery1',
                'vsourceAC': () => 'sV',
                'diode': () => 'D',
                'zener': () => 'zD',
                'led': () => 'leD',
                'photodiode': () => 'pD',
                'fuse': () => 'fuse',
                'lamp': () => 'lamp',
                'ammeter': () => 'ammeter',
                'voltmeter': () => 'voltmeter',
                'switchOpen': () => 'nos',
                'pushButton': () => 'push button'
            };

            if (bipoleTypes[comp.type]) {
                usePath = true;
            }

            if (usePath) {
                // Determine terminal distances from definition
                const t1 = def.terminals[0];
                const t2 = def.terminals[1];

                const radians = (comp.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(radians), sin = Math.sin(radians);

                // Calculate relative world coordinates of terminals
                const relT1x = t1.x * cos - t1.y * sin;
                const relT1y = t1.x * sin + t1.y * cos;
                const relT2x = t2.x * cos - t2.y * sin;
                const relT2y = t2.x * sin + t2.y * cos;

                const startX = ((comp.x + relT1x) / scale).toFixed(1);
                const startY = (-(comp.y + relT1y) / scale).toFixed(1);
                const endX = ((comp.x + relT2x) / scale).toFixed(1);
                const endY = (-(comp.y + relT2y) / scale).toFixed(1);

                // Combine component type and options into to[...]
                let pathOptions = [bipoleTypes[comp.type]()];

                if ((comp.type === 'vsource' || comp.type === 'isource') && (comp.style === 'european' || comp.style === 'classical')) {
                    pathOptions.push('european');
                }
                if (comp.label) pathOptions.push(`l=$${comp.label}$`);
                if (comp.value) pathOptions.push(`a=${comp.value}`);

                const optStr = pathOptions.join(', ');
                this.componentLineIndices[comp.id] = lines.length;
                lines.push(`  \\draw (${startX},${startY}) to[${optStr}] (${endX},${endY});`);
            } else {
                // Monopoles and Tripoles
                let tikzName = def.tikzName;
                if (comp.depletion && def.depletionVariant) {
                    tikzName = def.depletionVariant;
                }

                // Add transistor options (bulk, bodydiode, schottky base, etc.)
                if (comp.transistorOptions && comp.transistorOptions.length > 0) {
                    nodeOptions.push(...comp.transistorOptions);
                }

                if (comp.style && comp.style !== 'default') nodeOptions.push(comp.style);

                if (comp.rotation) nodeOptions.push(`rotate=${-comp.rotation}`);
                if (comp.flippedX) nodeOptions.push('xscale=-1');
                if (comp.flippedY) nodeOptions.push('yscale=-1');
                if (def.options) nodeOptions.push(def.options);
                if (comp.label) nodeOptions.push(`l=$${comp.label}$`);
                if (comp.value) nodeOptions.push(`a=${comp.value}`);

                // Center-based placement
                const nodeX = (comp.x / scale).toFixed(1);
                const nodeY = (-comp.y / scale).toFixed(1);

                const optStr = nodeOptions.length > 0 ? `, ${nodeOptions.join(', ')}` : '';
                this.componentLineIndices[comp.id] = lines.length;
                lines.push(`  \\node[${tikzName}${optStr}] (${comp.name}) at (${nodeX},${nodeY}) {};`);

                // Bulk/Doublegate connections
                if (comp.transistorOptions && comp.transistorOptions.includes('bulk') && comp.bulkConnection) {
                    lines.push(`  \\draw (${comp.name}.bulk) -- (${comp.name}.${comp.bulkConnection});`);
                }
                if (comp.transistorOptions && comp.transistorOptions.includes('doublegate') && comp.doublegateConnection) {
                    lines.push(`  \\draw (${comp.name}.G2) -- (${comp.name}.${comp.doublegateConnection});`);
                }
            }
        });

        // 3. Generate wires (using anchors if available)
        this.wires.forEach(wire => {
            this.wireLineIndices[wire.id] = lines.length;

            const startAnchor = terminalMap.get(`${wire.x1},${wire.y1}`);
            const endAnchor = terminalMap.get(`${wire.x2},${wire.y2}`);

            const p1 = startAnchor ? `(${startAnchor})` : `(${(wire.x1 / scale).toFixed(1)},${(-wire.y1 / scale).toFixed(1)})`;
            const p2 = endAnchor ? `(${endAnchor})` : `(${(wire.x2 / scale).toFixed(1)},${(-wire.y2 / scale).toFixed(1)})`;

            // Use orthogonal wires if aligned
            if (Math.abs(wire.x1 - wire.x2) < 1 || Math.abs(wire.y1 - wire.y2) < 1) {
                lines.push(`  \\draw ${p1} -- ${p2};`);
            } else {
                const mode = wire.cornerMode || 'hv';
                const connector = mode === 'vh' ? '|-' : '-|';
                lines.push(`  \\draw ${p1} ${connector} ${p2};`);
            }
        });

        // 4. Generate junction dots
        const junctions = this.findJunctions();
        junctions.forEach(junc => {
            const key = `${junc.x},${junc.y}`;
            const anchor = terminalMap.get(key);
            const pos = anchor ? `(${anchor})` : `(${(junc.x / scale).toFixed(1)},${(-junc.y / scale).toFixed(1)})`;
            lines.push(`  \\node[circ] at ${pos} {};`);
        });

        lines.push('\\end{circuitikz}');
        return lines.join('\n');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    copyCode() {
        const code = this.generateCircuitikzCode();
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('Code copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy code', 'error');
        });
    }

    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;

        setTimeout(() => {
            toast.className = 'toast';
        }, 2000);
    }

    // ========================================
    // UNDO/REDO SYSTEM
    // ========================================

    saveState() {
        const state = {
            components: JSON.parse(JSON.stringify(this.components.map(c => ({
                id: c.id,
                type: c.type,
                category: c.category,
                x: c.x,
                y: c.y,
                rotation: c.rotation,
                flippedX: c.flippedX,
                flippedY: c.flippedY,
                style: c.style,
                label: c.label,
                labelPosition: c.labelPosition,
                value: c.value,
                valueNum: c.valueNum,
                valueUnit: c.valueUnit,
                name: c.name
            })))),
            wires: JSON.parse(JSON.stringify(this.wires)),
            nextId: this.nextId,
            componentCounters: JSON.parse(JSON.stringify(this.componentCounters))
        };
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) {
            this.showToast('Nothing to undo');
            return;
        }
        const currentState = {
            components: JSON.parse(JSON.stringify(this.components.map(c => ({
                id: c.id,
                type: c.type,
                category: c.category,
                x: c.x,
                y: c.y,
                rotation: c.rotation,
                label: c.label,
                labelPosition: c.labelPosition,
                value: c.value,
                valueNum: c.valueNum,
                valueUnit: c.valueUnit,
                name: c.name
            })))),
            wires: JSON.parse(JSON.stringify(this.wires)),
            nextId: this.nextId,
            componentCounters: JSON.parse(JSON.stringify(this.componentCounters))
        };
        this.redoStack.push(currentState);
        const prevState = this.undoStack.pop();
        this.restoreState(prevState);
        this.showToast('Undo');
    }

    redo() {
        if (this.redoStack.length === 0) {
            this.showToast('Nothing to redo');
            return;
        }

        // Save current state to undo stack
        const currentState = {
            components: JSON.parse(JSON.stringify(this.components.map(c => ({
                id: c.id,
                type: c.type,
                category: c.category,
                x: c.x,
                y: c.y,
                rotation: c.rotation,
                flippedX: c.flippedX,
                flippedY: c.flippedY,
                style: c.style,
                label: c.label,
                labelPosition: c.labelPosition,
                value: c.value,
                valueNum: c.valueNum,
                valueUnit: c.valueUnit,
                name: c.name
            })))),
            wires: JSON.parse(JSON.stringify(this.wires)),
            nextId: this.nextId,
            componentCounters: JSON.parse(JSON.stringify(this.componentCounters))
        };
        this.undoStack.push(currentState);

        // Restore next state
        const nextState = this.redoStack.pop();
        this.restoreState(nextState);

        this.showToast('Redo');
    }

    cleanupWires() {
        // Remove zero-length wires
        this.wires = this.wires.filter(w => Math.abs(w.x1 - w.x2) > 1 || Math.abs(w.y1 - w.y2) > 1);

        // Repeatedly try to merge wires until no more merges are possible
        let merged = true;
        while (merged) {
            merged = false;
            for (let i = 0; i < this.wires.length; i++) {
                for (let j = i + 1; j < this.wires.length; j++) {
                    const w1 = this.wires[i];
                    const w2 = this.wires[j];

                    // Check if they share an endpoint
                    const shared = this.getSharedEndpoint(w1, w2);
                    if (shared) {
                        // Check if this shared point is a junction (3+ wires or terminal)
                        // If it's NOT a junction, we can potentially merge
                        const isJunc = this.isJunction(shared.x, shared.y);
                        if (!isJunc) {
                            const newWire = this.mergeWires(w1, w2);
                            if (newWire) {
                                this.wires.splice(j, 1);
                                this.wires[i] = newWire;
                                merged = true;
                                break;
                            }
                        }
                    }
                }
                if (merged) break;
            }
        }
    }

    getSharedEndpoint(w1, w2) {
        const eps = 1;
        if (Math.abs(w1.x1 - w2.x1) < eps && Math.abs(w1.y1 - w2.y1) < eps) return { x: w1.x1, y: w1.y1 };
        if (Math.abs(w1.x1 - w2.x2) < eps && Math.abs(w1.y1 - w2.y2) < eps) return { x: w1.x1, y: w1.y1 };
        if (Math.abs(w1.x2 - w2.x1) < eps && Math.abs(w1.y2 - w2.y1) < eps) return { x: w1.x2, y: w1.y2 };
        if (Math.abs(w1.x2 - w2.x2) < eps && Math.abs(w1.y2 - w2.y2) < eps) return { x: w1.x2, y: w1.y2 };
        return null;
    }

    isJunction(x, y) {
        // A point is a junction if:
        // 1. More than 2 wire endpoints meet there
        // 2. OR a terminal is there
        const eps = 2;

        // Count wire endpoints at this location
        let endpointCount = 0;
        this.wires.forEach(w => {
            if (Math.abs(w.x1 - x) < eps && Math.abs(w.y1 - y) < eps) endpointCount++;
            if (Math.abs(w.x2 - x) < eps && Math.abs(w.y2 - y) < eps) endpointCount++;
        });

        if (endpointCount > 2) return true;

        // Check if any terminal is here
        const terminal = this.findNearestTerminal(x, y, 5);
        if (terminal) return true;

        return false;
    }

    restoreState(state) {
        // Rebuild components with their definitions
        this.components = state.components.map(c => {
            const def = COMPONENTS[c.category]?.items[c.type];
            const comp = {
                ...c,
                def: def || { width: 60, height: 30, terminals: [], tikzName: c.type }
            };
            // Ensure every component has a name (for backward compatibility or drop-recovery)
            if (!comp.name) {
                comp.name = this.generateComponentName(comp.type);
            }
            return comp;
        });

        this.wires = state.wires;
        this.nextId = state.nextId;
        this.componentCounters = state.componentCounters || {};
        this.selectedComponent = null;
        this.selectedWire = null;

        this.updatePropertiesPanel();
        this.cleanupWires();
        this.updateCode();
        this.render();
    }

    generateComponentName(type) {
        const prefixMap = {
            'resistor': 'R', 'resistorEU': 'R', 'varResistor': 'R', 'potentiometer': 'POT',
            'capacitor': 'C', 'polarCap': 'C', 'inductor': 'L', 'inductorAM': 'L',
            'vsource': 'V', 'isource': 'I', 'battery': 'V', 'vsourceAC': 'V',
            'diode': 'D', 'zener': 'D', 'led': 'D', 'photodiode': 'D',
            'npn': 'Q', 'pnp': 'Q', 'nmos': 'M', 'pmos': 'M',
            'opamp': 'U',
            'switchOpen': 'SW', 'pushButton': 'SW',
            'ammeter': 'A', 'voltmeter': 'V',
            'andGate': 'U', 'orGate': 'U', 'notGate': 'U',
            'ground': 'GND', 'vcc': 'VCC', 'vee': 'VEE', 'antenna': 'ANT'
        };

        const prefix = prefixMap[type] || 'U';
        if (!this.componentCounters[prefix]) {
            this.componentCounters[prefix] = 1;
        }
        return prefix + (this.componentCounters[prefix]++);
    }

    // ========================================
    // TERMINAL SYSTEM
    // ========================================

    getComponentTerminals(comp) {
        // Get world-space coordinates of component terminals
        const terminals = [];
        const def = comp.def;
        // Negative for CCW to match TikZ convention
        const angle = -comp.rotation * Math.PI / 180;

        if (def.terminals) {
            def.terminals.forEach((term, index) => {
                // Apply flip transformations first
                let termX = term.x;
                let termY = term.y;

                if (comp.flippedX) {
                    termX = -termX;
                }
                if (comp.flippedY) {
                    termY = -termY;
                }

                // Then rotate terminal position
                const rotX = termX * Math.cos(angle) - termY * Math.sin(angle);
                const rotY = termX * Math.sin(angle) + termY * Math.cos(angle);

                terminals.push({
                    x: comp.x + rotX,
                    y: comp.y + rotY,
                    componentId: comp.id,
                    terminalIndex: index
                });
            });
        }

        return terminals;
    }

    getAllTerminals() {
        // Get all terminals from all components
        const terminals = [];
        this.components.forEach(comp => {
            terminals.push(...this.getComponentTerminals(comp));
        });
        return terminals;
    }

    findNearestTerminal(x, y, threshold = 15) {
        // Find the nearest terminal within threshold distance
        let nearest = null;
        let minDist = threshold;

        const terminals = this.getAllTerminals();

        terminals.forEach(term => {
            const dist = Math.sqrt((x - term.x) ** 2 + (y - term.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearest = term;
            }
        });

        return nearest;
    }

    findWireEndpoint(x, y, threshold = 10) {
        // Find if x,y is near an existing wire endpoint
        for (const wire of this.wires) {
            const dist1 = Math.sqrt((x - wire.x1) ** 2 + (y - wire.y1) ** 2);
            const dist2 = Math.sqrt((x - wire.x2) ** 2 + (y - wire.y2) ** 2);

            if (dist1 < threshold) {
                return { wire, endpoint: 1, x: wire.x1, y: wire.y1 };
            }
            if (dist2 < threshold) {
                return { wire, endpoint: 2, x: wire.x2, y: wire.y2 };
            }
        }
        return null;
    }

    mergeWires(wire1, wire2) {
        // Try to merge two wires if they share an endpoint and form a continuous path
        // Returns merged wire or null if can't merge

        const eps = 1; // Epsilon for floating point comparison

        // Check all endpoint combinations
        const combos = [
            { w1_start: true, w2_start: true },
            { w1_start: true, w2_start: false },
            { w1_start: false, w2_start: true },
            { w1_start: false, w2_start: false }
        ];

        for (const combo of combos) {
            const w1x = combo.w1_start ? wire1.x1 : wire1.x2;
            const w1y = combo.w1_start ? wire1.y1 : wire1.y2;
            const w2x = combo.w2_start ? wire2.x1 : wire2.x2;
            const w2y = combo.w2_start ? wire2.y1 : wire2.y2;

            if (Math.abs(w1x - w2x) < eps && Math.abs(w1y - w2y) < eps) {
                // Shared endpoint at (w1x, w1y)
                const far1x = combo.w1_start ? wire1.x2 : wire1.x1;
                const far1y = combo.w1_start ? wire1.y2 : wire1.y1;
                const far2x = combo.w2_start ? wire2.x2 : wire2.x1;
                const far2y = combo.w2_start ? wire2.y2 : wire2.y1;

                const w1Horiz = Math.abs(wire1.y1 - wire1.y2) < eps;
                const w1Vert = Math.abs(wire1.x1 - wire1.x2) < eps;
                const w1L = !w1Horiz && !w1Vert;
                const w2Horiz = Math.abs(wire2.y1 - wire2.y2) < eps;
                const w2Vert = Math.abs(wire2.x1 - wire2.x2) < eps;
                const w2L = !w2Horiz && !w2Vert;

                // Case 1: Both straight and collinear
                if ((w1Horiz && w2Horiz && Math.abs(far1y - far2y) < eps) ||
                    (w1Vert && w2Vert && Math.abs(far1x - far2x) < eps)) {
                    return { id: wire1.id, x1: far1x, y1: far1y, x2: far2x, y2: far2y };
                }

                // Case 2: One straight, one L-shaped (if they form a single corner)
                // Example: (A)-(B) horizontal + (B)-|(C) hv-corner. Merges to (A)-|(C) if A,B,B_corner are collinear.
                if ((w1Horiz && w2L && wire2.cornerMode === 'hv' && Math.abs(far1y - w2y) < eps) ||
                    (w1Vert && w2L && wire2.cornerMode === 'vh' && Math.abs(far1x - w2x) < eps)) {
                    // Merging straight into the "start" of L-shaped
                    if (combo.w2_start) {
                        return { id: wire1.id, x1: far1x, y1: far1y, x2: far2x, y2: far2y, cornerMode: wire2.cornerMode };
                    }
                }

                if ((w2Horiz && w1L && wire1.cornerMode === 'hv' && Math.abs(far2y - w1y) < eps) ||
                    (w2Vert && w1L && wire1.cornerMode === 'vh' && Math.abs(far2x - w1x) < eps)) {
                    // Merging straight into the "start" of L-shaped (from wire1's perspective)
                    if (combo.w1_start) {
                        return { id: wire1.id, x1: far2x, y1: far2y, x2: far1x, y2: far1y, cornerMode: wire1.cornerMode };
                    }
                }

                // Case 3: Two straight non-collinear meeting at B, forming a corner
                if ((w1Horiz && w2Vert) || (w1Vert && w2Horiz)) {
                    // Straight horizontal + straight vertical = one L-shaped
                    // determine cornerMode - if w1 is moveX, w2 is moveY, then hv
                    let mode = 'hv';
                    let realX1 = far1x, realY1 = far1y, realX2 = far2x, realY2 = far2y;

                    // We want x1, y1 to be the start of moveX if hv
                    if (w1Horiz) { // w1 is horizontal segment
                        // mode hv: start with H, then V. So w1 is the H part.
                        // (far1x, far1y) --- (w1x, w1y) | (far2x, far2y)
                        mode = 'hv';
                    } else { // w1 is vertical
                        // mode vh: start with V, then H. So w1 is the V part.
                        mode = 'vh';
                    }
                    return { id: wire1.id, x1: realX1, y1: realY1, x2: realX2, y2: realY2, cornerMode: mode };
                }
            }
        }

        return null;
    }

    snapToTerminalOrGrid(x, y) {
        // First check for nearby terminal
        const terminal = this.findNearestTerminal(x, y, 15);
        if (terminal) {
            return { x: terminal.x, y: terminal.y, snappedToTerminal: true, terminal };
        }

        // Then check for nearby wire endpoint
        const wireEnd = this.findWireEndpoint(x, y, 10);
        if (wireEnd) {
            return { x: wireEnd.x, y: wireEnd.y, snappedToWireEnd: true, wireEnd };
        }

        // NEW: Check for nearby wire body
        const nearWire = this.getWireAt(x, y, 10);
        if (nearWire) {
            const snapX = this.snapToGrid(x);
            const snapY = this.snapToGrid(y);
            // Verify the snapped point is actually on the wire
            if (this.isPointOnWire(snapX, snapY, nearWire)) {
                return { x: snapX, y: snapY, snappedToWireBody: true, wire: nearWire };
            }
        }

        // Otherwise snap to grid
        return {
            x: this.snapToGrid(x),
            y: this.snapToGrid(y),
            snappedToTerminal: false,
            snappedToWireEnd: false,
            snappedToWireBody: false
        };
    }
}

// Initialize the editor
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new CircuitEditor();
});
