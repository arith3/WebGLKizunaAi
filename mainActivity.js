
    var mmd = (function() {
    var container, stats;

    var mesh, camera, scene, renderer;
    var helper;

    var ready = false;

    var mouseX = 0,
        mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var clock = new THREE.Clock();

    var animate = function() {
        requestAnimationFrame(animate);
        render();
    };
    //stat fps listen
    // stats = new Stats();
    // stats.setMode(0);
    // stats.domElement.style.position = 'fixed';
    // stats.domElement.style.left = '0px';
    // stats.domElement.style.bottom = '0px';
    // stats.domElement.style.top = 'auto';
    // document.body.appendChild(stats.domElement);

    var op = {
        ambientColor: '#454545',
        directionalLightColor: '#CCCCCC',
        modelFile: {
            arisuchan: 'http://210.107.198.175:11111/mmd/model/kizunaai.pmx',
        },
        vmdFiles: {
            elysion: ['http://210.107.198.175:11111/mmd/gbmotion.vmd'],
        },
        cameraFiles: {
            elysion: ['http://210.107.198.175:11111/mmd/gbcamera.vmd']
        },
        audioFile: {
            elysion: 'http://210.107.198.175:11111/mmd/gbmusic.mp3',
        },
        container: 'mmd-container'
    };


    init();
    animate();

    var ambient;
    var plane;
    var directionalLight;

    function createStage() {
        if (document.getElementById(op.container)) {
            return false;
        }
        //create div
        container = document.createElement('div');
        container.id = op.container;
        if (!document.getElementById(container.id)) document.body.appendChild(container);

        //create camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);

        //create scene
        scene = new THREE.Scene();
        //create ambient light
        ambient = new THREE.AmbientLight(op.ambientColor);
        scene.add(ambient);

        //create directionalLight
        directionalLight = new THREE.DirectionalLight(op.directionalLightColor);
        directionalLight.position.set(-1, 1, 1).normalize();
        scene.add(directionalLight);

        //create plane
        var geometry = new THREE.PlaneBufferGeometry(200, 200, 40, 40);
        var material = new THREE.MeshLambertMaterial({
            color: 0xa0becd,
            wireframe: true
        });
        plane = new THREE.Mesh(geometry, material);
        plane.position.y = 0;
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(new THREE.Color(0x000000));
        if (!container.getElementsByTagName('canvas')[0]) container.appendChild(renderer.domElement);
    }

    function changeLight(_op) {
        directionalLight.color.set(_op && _op.directionalLightColor || op.directionalLightColor);
        ambient.color.set(_op && _op.ambientColor || op.ambientColor);
    }

    function init(_op) {
        createStage();
        changeLight(_op);

        function progressF(id) {
            return function(xhr) {
                if (xhr.lengthComputable) {
                    //var percentComplete = xhr.loaded / xhr.total * 100;
                    //document.getElementById(id).innerHTML = Math.round(percentComplete, 2) + '% downloaded';
                    console.log('Downloading: '+id+'...');
                }
            };
        }

        function onError(id, path) {
            return function(xhr) {
                console.log(id, path);
            };
        }

        var modelFile = _op && _op.modelFile || op.modelFile.arisuchan;
        var vmdFiles = _op && _op.vmdFiles || op.vmdFiles.elysion;
        vmdFiles = vmdFiles.slice();
        if (typeof vmdFiles == 'string') {
            vmdFiles = [vmdFiles]
        }
        var audioFile = _op && _op.audioFile || op.audioFile.elysion;
        var cameraFiles = _op && _op.cameraFiles || op.cameraFiles.elysion;
        cameraFiles = cameraFiles.slice();
        if (typeof cameraFiles == 'string') {
            cameraFiles = [cameraFiles]
        }
        var audioParams = {
            delayTime: 0,
            autoplay: false
        };

        //mmd
        helper = new THREE.MMDHelper(renderer);

        var loader = new THREE.MMDLoader();

        loader.loadAudio(audioFile, function(audio, listener) {

            listener.position.z = 1;
            helper.setAudio(audio, listener, audioParams);
            helper.unifyAnimationDuration();

            audio.name = 'audio';
            listener.name = 'listener';

            scene.add(audio);
            scene.add(listener);

            loader.load(modelFile, vmdFiles, function(object) {
                mesh = object;
                mesh.name = 'mesh';
                helper.add(mesh);
                scene.add(mesh);
                helper.setAnimation(mesh);
                if (!isMobileDevice()) {
                    helper.setPhysics(mesh);
                }

                loader.loadVmds(cameraFiles, function(vmd) {

                    helper.setCamera(camera);
                    loader.pourVmdIntoCamera(camera, vmd);
                    helper.setCameraAnimation(camera);
                    canPlay(_op);

                }, progressF('camera'), onError('camera', cameraFiles));
            }, progressF('model'), onError('model', [modelFile, vmdFiles]));
        }, progressF('audio'), onError('audio', audioFile));

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        window.addEventListener('resize', onWindowResize, false);
    }

    function canPlay(_op) {
        ready = true;
        if (_op && _op.callback && typeof _op.callback == 'function') {
            _op.callback();
        }
    }

    function remove(name) {
        scene.remove(scene.getObjectByName(name))
    }

    function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function onDocumentMouseMove(event) {

        mouseX = (event.clientX - windowHalfX) / 2;
        mouseY = (event.clientY - windowHalfY) / 2;

    }

    function render() {

        if (ready) {
            var delta = clock.getDelta();
            helper.animate(delta);
            helper.render(scene, camera);
            //stats.update();
        } else {
            window.cancelAnimationFrame(animate);
            renderer.clear();
            renderer.render(scene, camera);
        }
    }

    // easy mobile device detection
    function isMobileDevice() {

        if (navigator === undefined || navigator.userAgent === undefined) {
            return true;
        }

        var s = navigator.userAgent;
        if (s.match(/iPhone/i) || s.match(/iPod/i) || s.match(/webOS/i) || s.match(/BlackBerry/i) || (s.match(/Windows/i) && s.match(/Phone/i)) || (s.match(/Android/i) && s.match(/Mobile/i))) {
            return true;
        }
        return false;
    }

    var sf = {
        pause: function() {
            ready = false;
            helper.audioManager.audio.pause();
        },
        play: function() {
            ready = true;
            animate();
            helper.audioManager.audio.play();
        }
    };

    // DAT-GUI
    var controls = new function() {
        this.playing = ready || true;
        this.ambientColor = op.ambientColor;
        this.directionalLightColor = op.directionalLightColor;
    };

    return scene;})();