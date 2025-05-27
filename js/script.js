document.addEventListener('DOMContentLoaded', () => {
    // === DROPDOWN MENU TOGGLE LOGIC ===
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (menuToggleBtn && dropdownMenu) {
        menuToggleBtn.addEventListener('click', (event) => {
            event.stopPropagation(); 
            const isOpen = dropdownMenu.classList.toggle('open');
            menuToggleBtn.classList.toggle('open', isOpen);
            menuToggleBtn.setAttribute('aria-expanded', isOpen.toString());
            dropdownMenu.setAttribute('aria-hidden', (!isOpen).toString());
            const btnTextElement = menuToggleBtn.querySelector('.btn-text');
            if (btnTextElement) {
                btnTextElement.textContent = isOpen ? 'CLOSE' : 'MENU';
            }
        });
        document.addEventListener('click', (event) => {
            if (dropdownMenu.classList.contains('open') && 
                !dropdownMenu.contains(event.target) && 
                !menuToggleBtn.contains(event.target)) {
                dropdownMenu.classList.remove('open');
                menuToggleBtn.classList.remove('open');
                menuToggleBtn.setAttribute('aria-expanded', 'false');
                dropdownMenu.setAttribute('aria-hidden', 'true');
                const btnTextElement = menuToggleBtn.querySelector('.btn-text');
                if (btnTextElement) btnTextElement.textContent = 'MENU';
            }
        });
        dropdownMenu.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', () => {
                if (dropdownMenu.classList.contains('open')) {
                    dropdownMenu.classList.remove('open');
                    menuToggleBtn.classList.remove('open');
                    menuToggleBtn.setAttribute('aria-expanded', 'false');
                    dropdownMenu.setAttribute('aria-hidden', 'true');
                    const btnTextElement = menuToggleBtn.querySelector('.btn-text');
                    if (btnTextElement) btnTextElement.textContent = 'MENU';
                }
            });
        });
    }

    // Update copyright year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // "Resume" button in header
    const resumeBtnHeader = document.querySelector('header .resume-btn');
    if (resumeBtnHeader) {
        resumeBtnHeader.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('path/to/your-resume.pdf', '_blank');
        });
    }

    // Basic Scroll Animations (Fade-in)
    const animatedElements = document.querySelectorAll('.fade-in');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        animatedElements.forEach(element => observer.observe(element));
    }
    
    // Icon button placeholder
    const iconBtn = document.querySelector('.icon-btn');
    if (iconBtn) iconBtn.addEventListener('click', () => console.log("Icon button clicked!"));

    // === HORIZONTAL SCROLL HIJACK FOR PROJECT DETAIL PAGES ===
    const projectDetailBody = document.body.classList.contains('project-detail-page-horizontal');
    const mainHorizontalScroller = document.getElementById('projectDetailContainer'); // This is the <main> element

    if (projectDetailBody && mainHorizontalScroller) {
        console.log("Horizontal scroll listener setup for project detail page."); // For debugging

        let currentScroll = mainHorizontalScroller.scrollLeft;
        let targetScroll = mainHorizontalScroller.scrollLeft;
        const easeFactor = 0.08; // Adjust for smoothness (0.05 to 0.1 is usually good)
        let maxScroll = 0;
        let animationFrameId = null;

        function updateMainMaxScroll() {
            maxScroll = mainHorizontalScroller.scrollWidth - mainHorizontalScroller.clientWidth;
            // Clamp current values if maxScroll changed (e.g., window resize)
            targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
            currentScroll = Math.max(0, Math.min(currentScroll, maxScroll)); // Update currentScroll too
            mainHorizontalScroller.scrollLeft = currentScroll; // Apply immediately after resize
            console.log("Max scroll updated:", maxScroll); // For debugging
        }
        
        window.addEventListener('resize', updateMainMaxScroll);

        // Debounced update for images (basic version)
        let imageLoadTimeout;
        const imagesInScroller = mainHorizontalScroller.querySelectorAll('.project-slide img, .project-slide video');
        let imagesToLoadCount = imagesInScroller.length;

        function checkAllImagesLoaded() {
            imagesToLoadCount--;
            // console.log("Media loaded, remaining:", imagesToLoadCount); // Debug
            if (imagesToLoadCount <= 0) {
                clearTimeout(imageLoadTimeout);
                imageLoadTimeout = setTimeout(() => {
                    // console.log("All media likely loaded, updating max scroll."); // Debug
                    updateMainMaxScroll();
                }, 250); // Wait a bit for layout reflow
            }
        }

        if (imagesInScroller.length > 0) {
            imagesInScroller.forEach(media => {
                if (media.tagName === 'IMG') {
                    if (media.complete) {
                        checkAllImagesLoaded();
                    } else {
                        media.onload = checkAllImagesLoaded;
                        media.onerror = checkAllImagesLoaded; 
                    }
                } else if (media.tagName === 'VIDEO') {
                     if (media.readyState >= 3) { // HAVE_FUTURE_DATA or more
                        checkAllImagesLoaded();
                    } else {
                        media.onloadeddata = checkAllImagesLoaded;
                        media.onerror = checkAllImagesLoaded;
                    }
                }
            });
        } else {
             updateMainMaxScroll(); // Calculate if no images/videos
        }
        // Initial call in case content is already loaded or no images
        setTimeout(updateMainMaxScroll, 100);


        mainHorizontalScroller.addEventListener('wheel', (event) => {
            const introRightScroller = document.getElementById('introRightScroller'); // For nested scroll
            if (introRightScroller && introRightScroller.contains(event.target)) {
                // Allow native scroll for the nested scroller if mouse is over it
                return; 
            }

            event.preventDefault(); // Prevent default vertical page scroll
            
            // Determine scroll direction and amount
            // event.deltaY > 0 means scrolling down (or right on some trackpads)
            // event.deltaY < 0 means scrolling up (or left on some trackpads)
            let scrollAmount = event.deltaY;

            // Some trackpads/mice have deltaX for horizontal, deltaY for vertical.
            // Others use deltaY for primary scroll axis, and might have deltaMode for lines/pages.
            // Lusion's example feels like vertical scroll maps to horizontal.
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && event.deltaX !== 0) {
                scrollAmount = event.deltaX; // Prioritize explicit horizontal scroll if present
            }
            
            targetScroll += scrollAmount * 0.7; // Adjust sensitivity factor (0.5 to 1.0 typically)
            targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
            
            startMainSmoothScrollLoop(); // Ensure animation loop is running to apply the scroll
        }, { passive: false }); // passive:false is crucial for preventDefault() to work

        let isTouching = false;
        let touchStartX = 0;
        let scrollLeftStart = 0;

        mainHorizontalScroller.addEventListener('touchstart', (event) => {
            const introRightScroller = document.getElementById('introRightScroller');
            if (introRightScroller && introRightScroller.contains(event.target)) {
                isTouching = false; 
                return;
            }
            isTouching = true;
            touchStartX = event.touches[0].pageX;
            scrollLeftStart = mainHorizontalScroller.scrollLeft; // Use current scrollLeft
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }, { passive: true });

        mainHorizontalScroller.addEventListener('touchmove', (event) => {
            if (!isTouching) return;
            // No event.preventDefault() here if passive:true, to allow native vertical scroll
            // on other parts of the page IF body overflow-y is not hidden.
            // But since body.project-detail-page-horizontal has overflow:hidden, this is fine.

            const touchX = event.touches[0].pageX;
            const touchDeltaX = touchX - touchStartX;
            
            currentScroll = scrollLeftStart - touchDeltaX * 1.0; // Sensitivity for touch drag
            currentScroll = Math.max(0, Math.min(currentScroll, maxScroll));
            targetScroll = currentScroll; // Sync target for immediate effect
            
            mainHorizontalScroller.scrollLeft = currentScroll; 
        }, { passive: true }); 

        function touchendOrcancelMain() {
            if (!isTouching) return; 
            isTouching = false;
            // After touch ends, allow easing to take over if there was momentum (not implemented here)
            // For now, just ensure the loop starts if it wasn't running to snap to target if needed.
            startMainSmoothScrollLoop();
        }
        mainHorizontalScroller.addEventListener('touchend', touchendOrcancelMain);
        mainHorizontalScroller.addEventListener('touchcancel', touchendOrcancelMain);

        function smoothMainScrollLoop() {
            if (Math.abs(targetScroll - currentScroll) > 0.1) {
                currentScroll += (targetScroll - currentScroll) * easeFactor;
                mainHorizontalScroller.scrollLeft = Math.round(currentScroll); // Use Math.round for smoother rendering
                animationFrameId = requestAnimationFrame(smoothMainScrollLoop);
            } else {
                // Snap to final position if very close, and stop the loop
                if (currentScroll !== targetScroll) {
                    mainHorizontalScroller.scrollLeft = targetScroll;
                    currentScroll = targetScroll;
                }
                animationFrameId = null; 
            }
        }
        
        function startMainSmoothScrollLoop() {
            if (!animationFrameId && !isTouching) { // Only start if not already running and not touching
                animationFrameId = requestAnimationFrame(smoothMainScrollLoop);
            }
        }
        // No initial call to startMainSmoothScrollLoop needed unless targetScroll might differ from initial scrollLeft
    }
    // === END OF HORIZONTAL SCROLL HIJACK ===


    // === START: INTERACTIVE DRAWING WITH PHYSICS (FOR HOMEPAGE HERO) ===
    const drawingContainer = document.getElementById('drawingPhysicsContainer'); // This should be the ID of .hero-visual on index.html
    const canvas = document.getElementById('drawingCanvas'); // The canvas inside drawingPhysicsContainer

    if (drawingContainer && canvas && typeof CANNON !== 'undefined' && 
        !document.body.classList.contains('project-detail-page-horizontal') /* Run only on homepage */ ) {
        
        const ctx = canvas.getContext('2d');
        let world;
        const physicsObjects = []; 
        const timeStep = 1 / 60;
        let canvasWidth, canvasHeight;
        const scaleFactor = 15; // Physics units are 1/15th of canvas pixels

        function resizeDrawingCanvas() {
            canvasWidth = drawingContainer.clientWidth;
            canvasHeight = drawingContainer.clientHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            // Update physics bounds if they depend on canvas size
            if (world) {
                // Example: remove and re-add walls if their positions change
                // This is simplified; a robust solution would update existing bodies
                // For now, we'll just ensure they are created after first resize.
            }
        }

        function initDrawingPhysics() {
            resizeDrawingCanvas();

            world = new CANNON.World();
            world.gravity.set(0, -30 / scaleFactor, 0); // Gravity pulling down (adjust strength)
            world.broadphase = new CANNON.NaiveBroadphase();
            world.solver.iterations = 5;

            const physicsCanvasHeight = canvasHeight / scaleFactor;
            const physicsCanvasWidth = canvasWidth / scaleFactor;

            // Ground plane
            const groundBody = new CANNON.Body({ mass: 0 });
            groundBody.addShape(new CANNON.Plane());
            groundBody.position.set(0, 0, 0); // Physics Y=0 is the floor
            world.addBody(groundBody);

            // Left Wall
            const leftWall = new CANNON.Body({ mass: 0 });
            leftWall.addShape(new CANNON.Plane());
            leftWall.quaternion.setFromEuler(0, Math.PI / 2, 0);
            leftWall.position.set(0, physicsCanvasHeight / 2, 0); 
            world.addBody(leftWall);

            // Right Wall
            const rightWall = new CANNON.Body({ mass: 0 });
            rightWall.addShape(new CANNON.Plane());
            rightWall.quaternion.setFromEuler(0, -Math.PI / 2, 0);
            rightWall.position.set(physicsCanvasWidth, physicsCanvasHeight / 2, 0); 
            world.addBody(rightWall);


            // Back and Front Walls
            const backWallBody = new CANNON.Body({ mass: 0 });
            backWallBody.addShape(new CANNON.Plane());
            backWallBody.position.set(physicsCanvasWidth / 2, physicsCanvasHeight / 2, -1); // Z = -1 (behind)
            world.addBody(backWallBody);

            const frontWallBody = new CANNON.Body({ mass: 0 });
            frontWallBody.addShape(new CANNON.Plane());
            frontWallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), Math.PI); // Normal points in -Z
            frontWallBody.position.set(physicsCanvasWidth / 2, physicsCanvasHeight / 2, 1); // Z = 1 (in front)
            world.addBody(frontWallBody);

            canvas.addEventListener('mousedown', handleDrawStart);
            canvas.addEventListener('touchstart', handleDrawStart, { passive: false }); // Add touch listeners if needed:
            // canvas.addEventListener('touchstart', handleDrawStart);
            
            animateDrawing();
        }
        
        let isDrawing = false;
        let lastPointTime = 0;
        const minTimeBetweenShapes = 30; // milliseconds, create shape roughly every 30ms while dragging

        // ... (handleDrawStart remains similar, but calls handleDrawMove on first point)

        function handleDrawStart(event) {
            event.preventDefault(); // Prevent page scroll on touch
            isDrawing = true;
            const point = getCanvasPoint(event);
            if (point) { // Ensure point is valid
                createFallingShape(point.x, point.y, true); // 'true' for initial larger shape
                lastPointTime = Date.now();
            }
            
            canvas.addEventListener('mousemove', handleDrawMove);
            canvas.addEventListener('touchmove', handleDrawMove, { passive: false });
            
            // Use window for mouseup/touchend to catch if user releases outside canvas
            window.addEventListener('mouseup', handleDrawEnd);
            window.addEventListener('touchend', handleDrawEnd);
            canvas.addEventListener('mouseleave', handleDrawEnd); // Could also stop here
        }

        function handleDrawMove(event) {
            if (!isDrawing) return;
            event.preventDefault(); // Prevent page scroll on touch

            const currentTime = Date.now();
            if (currentTime - lastPointTime > minTimeBetweenShapes) {
                const point = getCanvasPoint(event);
                if (point) {
                    createFallingShape(point.x, point.y, false); // 'false' for smaller trail shapes
                    lastPointTime = currentTime;
                }
            }
        }

        function handleDrawEnd() {
            isDrawing = false;
            window.removeEventListener('mousemove', handleDrawMove);
            window.removeEventListener('touchmove', handleDrawMove);
            window.removeEventListener('mouseup', handleDrawEnd);
            window.removeEventListener('touchend', handleDrawEnd);
            // canvas.removeEventListener('mouseleave', handleDrawEnd); // If you added it
        }
        
        function getCanvasPoint(event) {
            const rect = canvas.getBoundingClientRect();
            let x, y;
            if (event.touches && event.touches.length > 0) {
                x = event.touches[0].clientX - rect.left;
                y = event.touches[0].clientY - rect.top;
            } else {
                x = event.clientX - rect.left;
                y = event.clientY - rect.top;
            }
            // Ensure click is within canvas bounds for safety
            if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) return null;
            return { x, y };
        }

        function createFallingShape(canvasX, canvasY, isInitialShape) {
            const baseRadius = isInitialShape ? (Math.random() * 6 + 6) : (Math.random() * 3 + 2); // Larger on click, smaller for trail
            const colorIntensity = Math.floor(Math.random() * 100) + 30; // 30 to 130 (darker grays)
            const color = `rgb(${colorIntensity}, ${colorIntensity}, ${colorIntensity})`;
            // Occasionally add a white "highlight" particle
            const finalColor = Math.random() < 0.05 ? '#E0E0E0' : color;


            const body = new CANNON.Body({
                mass: isInitialShape ? 0.1 : 0.03, // Initial shapes slightly heavier
                shape: new CANNON.Sphere(baseRadius / scaleFactor),
                position: new CANNON.Vec3(
                    canvasX / scaleFactor,
                    (canvasHeight - canvasY) / scaleFactor,
                    (Math.random() - 0.5) * 0.2 // Slight Z jitter
                ),
                linearDamping: 0.2,  // Some damping
                angularDamping: 0.5, // Allow some spin
                material: new CANNON.Material({ friction: 0.3, restitution: 0.1 }) // Add material for bounciness/friction
            });

            // Give a slight initial velocity based on drawing direction (more advanced)
            // For now, just let them fall or have a tiny random nudge
            body.velocity.set(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.2, // Less initial Y velocity
                (Math.random() - 0.5) * 0.1
            );

            world.addBody(body);
            physicsObjects.push({ body, color: finalColor, radius: baseRadius, type: 'circle' });
        }

        // animateDrawing() remains the same as before
        function animateDrawing() {
            requestAnimationFrame(animateDrawing);
            world.step(timeStep);

            ctx.fillStyle = '#f0f0f0'; // Canvas background color (light grey like whiteboard)
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            physicsObjects.forEach(obj => {
                ctx.beginPath();
                const canvasX = obj.body.position.x * scaleFactor;
                const canvasY = canvasHeight - (obj.body.position.y * scaleFactor);
                
                if (obj.type === 'circle') {
                    ctx.arc(canvasX, canvasY, obj.radius, 0, Math.PI * 2);
                }
                ctx.fillStyle = obj.color;
                ctx.fill();
                ctx.closePath();

                // Optional: Remove objects that fall too far (if no bottom boundary or for cleanup)
                // if (obj.body.position.y < -obj.radius * 2 / scaleFactor) {
                //     world.removeBody(obj.body);
                //     physicsObjects.splice(physicsObjects.indexOf(obj), 1);
                // }
            });
        }

        window.addEventListener('resize', resizeDrawingCanvas);
        initDrawingPhysics();

    } else if (drawingContainer && !canvas && !document.body.classList.contains('project-detail-page-horizontal')) {
        console.error("Drawing canvas element with ID 'drawingCanvas' not found inside '#drawingPhysicsContainer' on homepage.");
    } else if (drawingContainer && canvas && typeof CANNON === 'undefined' && !document.body.classList.contains('project-detail-page-horizontal')) {
        console.error("Cannon-es library not loaded for drawing physics on homepage.");
    }
    // === END: INTERACTIVE DRAWING WITH PHYSICS ===

});