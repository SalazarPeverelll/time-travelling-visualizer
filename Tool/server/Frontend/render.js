/** render the canvas and timeline */
const BACKGROUND_COLOR = 0xffffff;
// Constants relating to the camera parameters.
const PERSP_CAMERA_FOV_VERTICAL = 70;
const PERSP_CAMERA_NEAR_CLIP_PLANE = 0.01;
const PERSP_CAMERA_FAR_CLIP_PLANE = 100;
const ORTHO_CAMERA_FRUSTUM_HALF_EXTENT = 1.2;
const MIN_ZOOM_SCALE = 0.8
const MAX_ZOOM_SCALE = 30
const NORMAL_SIZE = 5
const HOVER_SIZE = 10
const MAX_FOV = 70;
const MIN_FOV = 1

var isDragging = false;
var previousMousePosition = {
    x: 0,
    y: 0
};

  function drawCanvas(res) {
    // remove previous scene
    if (window.vueApp.animationFrameId) {
        console.log("stopAnimation")
        cancelAnimationFrame(window.vueApp.animationFrameId);
        window.vueApp.animationFrameId = undefined;
    }

    if (window.vueApp.scene) {
        window.vueApp.scene.traverse(function (object) {
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (object.material.isMaterial) {
                        cleanMaterial(object.material);
                    } else {
                        // 对于多材质的情况（材质数组）
                        for (const material of object.material) {
                            cleanMaterial(material);
                        }
                    }
                }
            }
        });

        while (window.vueApp.scene.children.length > 0) {
            window.vueApp.scene.remove(window.vueApp.scene.children[0]);
        }
    }
    console.log("afterscene", window.vueApp.scene)
    // remove previous scene
    if (window.vueApp.renderer) {
        if (container.contains(window.vueApp.renderer.domElement)) {
            console.log("removeDom")
            container.removeChild(window.vueApp.renderer.domElement);
        }
        window.vueApp.renderer.renderLists.dispose();
        window.vueApp.renderer.dispose();
    }
    console.log("afterrender", window.vueApp.render)
    container = document.getElementById("container")

    let newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    container = newContainer;
    
    console.log("currContainer", container.firstChild)
    // remove previous dom element
    if (container.firstChild) {
        while (container.firstChild) {
            container.removeChild(container.lastChild);
        }

    }
    console.log("currContainerAfter", container.firstChild)
    // create new Three.js scene
    window.vueApp.scene = new THREE.Scene();
    // get the boundary of the scene
    var x_min = res.grid_index[0]
    var y_min = res.grid_index[1]
    var x_max = res.grid_index[2]
    var y_max = res.grid_index[3]

    const cameraBounds = {
        minX: x_min,
        maxX: x_max,
        minY: y_min,
        maxY: y_max
    };
    var aspect = 1
    const rect = container.getBoundingClientRect();
    // console.log(res.grid_index)

    // window.vueApp.camera = new THREE.PerspectiveCamera(x_min * aspect, x_max * aspect, y_max, y_min, 1, 1000);

    const target = new THREE.Vector3(
        0, 0, 0
    );
    // based on screen size set the camera view 
    var aspectRatio = rect.width / rect.height;
    // window.vueApp.camera = new THREE.PerspectiveCamera(
    //     PERSP_CAMERA_FOV_VERTICAL,
    //     aspectRatio,
    //     PERSP_CAMERA_NEAR_CLIP_PLANE,
    //     PERSP_CAMERA_FAR_CLIP_PLANE
    //   );
    console.log("beforeCamera", window.vueApp.camera)
    window.vueApp.camera = new THREE.OrthographicCamera(x_min * aspect, x_max * aspect, y_max, y_min, 1, 1000);
    window.vueApp.camera.position.set(0, 0, 100);
    window.vueApp.camera.left = x_min * aspectRatio;
    window.vueApp.camera.right = x_max * aspectRatio;
    window.vueApp.camera.top = y_max;
    window.vueApp.camera.bottom = y_min;
    window.vueApp.camera.fov = MAX_FOV
    // console.log("startCamleft",window.vueApp.camera.left )
    // console.log("startCamright",window.vueApp.camera.right )
    // console.log("startCamtop",window.vueApp.camera.top )
    // console.log("startCambottom",window.vueApp.camera.bottom )
    // update the camera projection matrix
    window.vueApp.camera.updateProjectionMatrix();
    window.vueApp.camera.lookAt(target);
    window.vueApp.renderer = new THREE.WebGLRenderer();
    window.vueApp.renderer.setSize(rect.width, rect.height);
    window.vueApp.renderer.setClearColor(BACKGROUND_COLOR, 1);
    // console.log("heightrec", rect.height)
    // console.log("widthrec", rect.width)

    console.log("afterCamera", window.vueApp.camera)

  
    // set zoom speed
    function onDocumentMouseWheel(event) {
        // when mouse wheel adjust the camera zoom level 
        var rect = window.vueApp.renderer.domElement.getBoundingClientRect();
        var mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        var mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
        // Initial raycast
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), window.vueApp.camera);
        var intersectsBeforeZoom = raycaster.intersectObjects(window.vueApp.scene.children);
    
        if (intersectsBeforeZoom.length > 0) {
            var pointBeforeZoom = intersectsBeforeZoom[0].point;
          
            window.vueApp.camera.zoom += event.deltaY * - window.vueApp.canvasSetting.zoomSpeed;
            window.vueApp.camera.zoom = Math.max(MIN_ZOOM_SCALE, Math.min(window.vueApp.camera.zoom, MAX_ZOOM_SCALE)); // constrain min max zoom level

            window.vueApp.camera.updateProjectionMatrix(); // update camera projection matrix
  
  
    
            // Second raycast after adjusting zoom
            var raycaster2 = new THREE.Raycaster();
            raycaster2.setFromCamera(new THREE.Vector2(mouseX, mouseY), window.vueApp.camera);
            var intersectsAfterZoom = raycaster2.intersectObjects(window.vueApp.scene.children);
            // console.log("rat1", raycaster)
            // console.log("rat2", raycaster2)
            if (intersectsAfterZoom.length > 0) {
                var pointAfterZoom = intersectsAfterZoom[0].point;
                console.log("pointBforeZO", pointBeforeZoom)
                console.log("poinAfterz", pointAfterZoom)
                // Calculate movement scale based on the difference in intersection points
                var movementScale = pointBeforeZoom.distanceTo(pointAfterZoom);
                console.log("movermentscale", movementScale)
                // Determine direction towards the initial intersection point
                var direction = new THREE.Vector3().subVectors(window.vueApp.camera.position, pointBeforeZoom).normalize();
    
                // Apply movement scaled by the calculated difference
                window.vueApp.camera.position.add(direction.multiplyScalar(movementScale));
            }
        }
        
        window.vueApp.camera.updateProjectionMatrix();
        updateCurrHoverIndex(event, null, true,''); // Your custom logic
    }


    container.addEventListener('wheel', onDocumentMouseWheel, false)

    container.addEventListener('wheel', function (event) {
        event.preventDefault();
    })
    container.addEventListener('wheel', updateLabelPosition)

    container.appendChild(window.vueApp.renderer.domElement);
    // calculate the size and the center position
    var width = x_max - x_min;
    var height = y_max - y_min;
    var centerX = x_min + width / 2;
    var centerY = y_min + height / 2;

    let canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    var ctx = canvas.getContext("2d");
    var img = new Image();
    img.src = res.grid_color;
    img.crossOrigin = "anonymous";
    img.onload = () => {
        ctx.drawImage(img, 0, 0, 128, 128);
        let texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true; // 不设置needsUpdate为true的话，可能纹理贴图不刷新
        var plane_geometry = new THREE.PlaneGeometry(width, height);
        var material = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        const newMesh = new THREE.Mesh(plane_geometry, material);
        newMesh.position.set(centerX, centerY, 0);
        window.vueApp.scene.add(newMesh);
    }


    // 创建数据点
    var dataPoints = res.result
    dataPoints.push()
    var color = res.label_color_list

    var geometry = new THREE.BufferGeometry();
    var position = [];
    var colors = [];
    var sizes = []
    dataPoints.forEach(function (point, i) {
        position.push(point[0], point[1], 0); // 添加位置
        colors.push(color[i][0] / 255, color[i][1] / 255, color[i][2] / 255); // 添加颜色
        sizes.push(NORMAL_SIZE)
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    FRAGMENT_SHADER = createFragmentShader();
    VERTEX_SHADER = createVertexShader()
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            texture: { type: 't' },
            spritesPerRow: { type: 'f' },
            spritesPerColumn: { type: 'f' },
            color: { type: 'c' },
            fogNear: { type: 'f' },
            fogFar: { type: 'f' },
            isImage: { type: 'bool' },
            sizeAttenuation: { type: 'bool' },
            PointSize: { type: 'f' },
        },
        // vertexShader: VERTEX_SHADER,
        // fragmentShader: FRAGMENT_SHADER,
        vertexShader: `attribute float size; varying vec3 vColor; 
        void main() { 
            vColor = color; 
            gl_PointSize = size; 
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
    varying vec3 vColor;
    void main() {
        float r = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (r > 0.5) {
            discard;
        }
        gl_FragColor = vec4(vColor, 0.6);
    }`,
        transparent: true,
        vertexColors: true,
        depthTest: false,
        depthWrite: false,
        fog: true,
        blending: THREE.MultiplyBlending,
    });

    var points = new THREE.Points(geometry, shaderMaterial);
    window.vueApp.scene.add(points);

    // 创建 Raycaster 和 mouse 变量
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    // var distance = camera.position.distanceTo(points.position); // 相机到点云中心的距离
    // var threshold = distance * 0.1; // 根据距离动态调整阈值，这里的0.01是系数，可能需要调整
    // raycaster.params.Points.threshold = threshold;


    //  =========================  hover  start =========================================== //
    function onMouseMove(event) {
        raycaster.params.Points.threshold = 0.2 / window.vueApp.camera.zoom; // 根据点的屏幕大小调整
        // 转换鼠标位置到归一化设备坐标 (NDC)
        var rect = window.vueApp.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        // console.log("mouseX", mouse.x)
        // console.log("mouseY", mouse.y)
        // console.log("clientX",event.clientX)
        // console.log("clientY",event.clientY)
        // 通过鼠标位置更新射线
        raycaster.setFromCamera(mouse, window.vueApp.camera);
        // 检测射线与点云的相交
        var intersects = raycaster.intersectObject(points);
        console.log("lasthoverIndex", window.vueApp.lastHoveredIndex)
        
        if (intersects.length > 0) {
            // 获取最接近的交点
            var intersect = intersects[0];

            // 获取索引 - 这需要根据具体实现来确定如何获取
            var index = intersect.index;
            console.log("currIndex", index)
            // 在这里处理悬停事件
            if (window.vueApp.lastHoveredIndex != index) {
    
                // 重置上一个悬停的点的大小
                if (window.vueApp.lastHoveredIndex !== null) {
                    points.geometry.attributes.size.array[window.vueApp.lastHoveredIndex] = 5; // 假设5是原始大小
                }
                container.style.cursor = 'pointer';

                // 更新当前悬停的点的大小
                sizes.fill(NORMAL_SIZE); // 将所有点的大小重置为NORMAL_SIZE
                sizes[index] = HOVER_SIZE; // 将悬停的点的大小设置为HOVER_SIZE

                // 更新size属性并标记为需要更新
                geometry.attributes.size.array = new Float32Array(sizes);
                geometry.attributes.size.needsUpdate = true;
                window.vueApp.lastHoveredIndex = index;


                // updateCurrHoverIndex(event, index, false, '')
             
            }

        } else {
            container.style.cursor = 'default';
            // 如果没有悬停在任何点上，也重置上一个点的大小
            if (window.vueApp.lastHoveredIndex !== null) {
                sizes.fill(NORMAL_SIZE); // 将所有点的大小重置为5

                // 更新size属性并标记为需要更新
                geometry.attributes.size.array = new Float32Array(sizes);
                // geometry.attributes.size.array[lastHoveredIndex] = NORMAL_SIZE
                geometry.attributes.size.needsUpdate = true;
                window.vueApp.lastHoveredIndex = null;
                // resultImg = document.getElementById("metaInfo")
                // resultImg.setAttribute("style", "display:none;")
                window.vueApp.imageSrc = ""
                // updateCurrHoverIndex(event, null, false, '')

            }
        }
    }
    //  =========================  hover  end =========================================== //



    container.addEventListener('mousemove', onMouseMove, false);

     //  =========================  db click start =========================================== //
    container.addEventListener('dblclick', onDoubleClick);

    function onDoubleClick(event) {
        // Raycasting to find the intersected point
        var rect = window.vueApp.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, window.vueApp.camera);
      
        var intersects = raycaster.intersectObject(points);
        var fixedHoverLabel = document.getElementById('fixedHoverLabel')
        if (intersects.length > 0) {
          // Get the index and position of the double-clicked point
          var intersect = intersects[0];
          window.vueApp.selectedIndex = intersect.index;
          window.vueApp.selectedPointPosition = intersect.point;
      
          // Call function to update label position and content
          updateFixedHoverLabel(event.clientX, event.clientY, intersect.index, '');
        } else {
          // If the canvas was double-clicked without hitting a point, hide the label and reset
          window.vueApp.selectedIndex = null;
          window.vueApp.selectedPointPosition = null;
          if (fixedHoverLabel) {
            fixedHoverLabel.style.display = 'none';
          }
        
        }
      }

     //  =========================  db click  end =========================================== //
    // update position of fixed hover index when dragging or mouse down
    // container.addEventListener('mousedown', updateLabelPosition);




    //  =========================  Drag start =========================================== //
    container.addEventListener('mousedown', function (e) {
        if (window.vueApp.SelectionMode && window.vueApp.isShifting) {

        } else {
            isDragging = true;
            console.log(isDragging)
            container.style.cursor = 'move';
            previousMousePosition.x = e.clientX;
            previousMousePosition.y = e.clientY;
            // previousMousePosition.x = e.cl;
            // previousMousePosition.y = mouse.y;
        }
    });

    // handel mouse move
    container.addEventListener('mousemove', function (e) {
        if (isDragging) {
           
            const currentZoom = window.vueApp.camera.zoom;

            let deltaX = e.clientX - previousMousePosition.x;
            let deltaY = e.clientY - previousMousePosition.y;
    
            const aspectRatio = window.innerWidth / window.innerHeight;
            const viewportWidth = window.vueApp.renderer.domElement.clientWidth;
            const viewportHeight = window.vueApp.renderer.domElement.clientHeight;
    
            // Scale factors
            const scaleX = (window.vueApp.camera.right - window.vueApp.camera.left) / viewportWidth;
            const scaleY = (window.vueApp.camera.top - window.vueApp.camera.bottom) / viewportHeight;
    
            // Convert pixel movement to world units
            deltaX = (deltaX * scaleX) / currentZoom;
            deltaY = (deltaY * scaleY) / currentZoom;
    
            // Update the camera position based on the scaled delta
            var newPosX = window.vueApp.camera.position.x - deltaX * 1;
            var newPosY = window.vueApp.camera.position.y + deltaY * 1;

            newPosX = Math.max(cameraBounds.minX, Math.min(newPosX, cameraBounds.maxX));
            newPosY = Math.max(cameraBounds.minY, Math.min(newPosY, cameraBounds.maxY));
      // update camera position
            window.vueApp.camera.position.x = newPosX;
            window.vueApp.camera.position.y = newPosY;
            // update previous mouse position
            previousMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
            var fixedHoverLabel = document.getElementById('fixedHoverLabel')
            if (fixedHoverLabel) {
                updateLabelPosition('');
            }
    
            updateCurrHoverIndex(e, null, true, '')

        }
    });

    // mouse up event
    container.addEventListener('mouseup', function (e) {
        isDragging = false;
        container.style.cursor = 'default';
    });

    //  =========================  Drag  end =========================================== //

    // create light
    var light = new THREE.PointLight(0xffffff, 1, 500);
    light.position.set(50, 50, 50);
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // The second parameter is the light intensity
    window.vueApp.scene.add(ambientLight);
    window.vueApp.scene.add(light);

    // set the camera position
    window.vueApp.camera.position.z = 30;

    // render
    function animate() {
        window.vueApp.animationFrameId = requestAnimationFrame(animate);
        window.vueApp.renderer.render(window.vueApp.scene, window.vueApp.camera);
    }
    animate();
    window.vueApp.isCanvasLoading = false
}

window.onload = function() {
    const currHover = document.getElementById('currHover');
    console.log("eataaaaa", currHover)
    makeDraggable(currHover, currHover);
  };