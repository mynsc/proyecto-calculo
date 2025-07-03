document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let ggbApp;
    let ggbAppReady = false;
    
    // Detectar elementos del DOM
    const input = document.getElementById('functionInput');
    const btn = document.getElementById('analyzeBtn');
    
    // Función para mostrar errores
    function mostrarError(mensaje) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        if (errorModal && errorMessage) {
            errorMessage.textContent = mensaje;
            errorModal.classList.remove('hidden');
        } else {
            alert(mensaje); // Fallback si no existe el modal
        }
    }
    
    // Inicializar GeoGebra
    function initGeoGebra() {
        const parameters = {
            "appName": "classic",
            "width": 800,
            "height": 400,
            "showToolBar": false,
            "showAlgebraInput": false,
            "showMenuBar": false,
            "algebraInputPosition": "none",
            "allowStyleBar": false,
            "allowUpScale": false,
            "showFullscreenButton": false,
            "showConstructionProtocolNavigation": false,
            "preventFocus": false,
            "language": "es",
            "borderColor": "#ffffff",
            "enableRightClick": false,
            "enableShiftDragZoom": true,
            "enableLabelDrags": false,
            "showZoomButtons": false,
            "showResetIcon": false,
            "clickToOpen": false,
            "appletOnLoad": function(api) {
                ggbApp = api;
                ggbAppReady = true;
                console.log("GeoGebra cargado exitosamente");
                
                // Configurar vista básica (sin métodos problemáticos)
                try {
                    api.setPerspective("G");

                    api.setGridVisible(false);
                    api.setCoordSystem(-10, 10, -10, 10); 
                } catch (e) {
                    console.log("Error en configuración inicial:", e);
                }
            }
        };
        
        const applet = new GGBApplet(parameters, true);
        applet.inject('geogebra-container');
    }

    // Convertir función para GeoGebra
    function convertirFuncionParaGeoGebra(funcionStr) {
        let funcion = funcionStr.toLowerCase();
        
        // Conversiones básicas
        funcion = funcion.replace(/\^/g, '^');
        funcion = funcion.replace(/ln\(/g, 'ln(');
        funcion = funcion.replace(/log\(/g, 'log(');
        funcion = funcion.replace(/sin\(/g, 'sin(');
        funcion = funcion.replace(/cos\(/g, 'cos(');
        funcion = funcion.replace(/tan\(/g, 'tan(');
        funcion = funcion.replace(/sqrt\(/g, 'sqrt(');
        funcion = funcion.replace(/abs\(/g, 'abs(');
        funcion = funcion.replace(/exp\(/g, 'exp(');
        
        // Asegurar multiplicación explícita
        funcion = funcion.replace(/(\d+)([a-z])/g, '$1*$2');
        funcion = funcion.replace(/([a-z])(\d+)/g, '$1*$2');
        funcion = funcion.replace(/\)([a-z])/g, ')*$1');
         const funciones = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'exp'];
        funciones.forEach(fn => {
            const regex = new RegExp(`${fn}\\*\\(`, 'g');
            funcion = funcion.replace(regex, `${fn}(`);
        });
        
        // Constantes
        funcion = funcion.replace(/\bpi\b/g, 'π');
        funcion = funcion.replace(/\be\b/g, 'ℯ');
        
        return funcion;
    }

    function detectarFuncionSigmoide(funcionStr) {
        const regex = /^\s*(\d+(?:\.\d+)?)\s*\/\s*\(\s*1\s*\+\s*e\^\s*\(-\s*(\d+(?:\.\d+)?)\s*\*\s*\(\s*x\s*-\s*(\d+(?:\.\d+)?)\s*\)\s*\)\s*\)\s*$/i;
        const match = funcionStr.replace(/\s+/g, '').match(regex);
    
        if (match) {
            const N = parseFloat(match[1]);
            const k = parseFloat(match[2]);
            const t = parseFloat(match[3]);
            return { esSigmoide: true, N, k, t };
        }

        return { esSigmoide: false };
    }


    // Función principal para graficar
    function graficarFuncion(funcionStr) {
        if (!ggbAppReady) {
            console.log("GeoGebra no está listo aún");
            setTimeout(() => graficarFuncion(funcionStr), 500);
            return;
        }

        try {
            // Limpiar gráfica anterior
            ggbApp.deleteObject("f");
            
            // Convertir función
            const funcionGeoGebra = convertirFuncionParaGeoGebra(funcionStr);
            console.log("Función convertida:", funcionGeoGebra);
            
            // Crear función en GeoGebra
            const comando = `f(x) = ${funcionGeoGebra}`;
            ggbApp.evalCommand(comando);
            
            // Configurar color y grosor
            ggbApp.setColor("f", 0, 143, 57);
            ggbApp.setLineThickness("f", 7);
            
            // Ajustar zoom
            setTimeout(() => {
                ggbApp.setCoordSystem(-10, 10, -10, 10);
            }, 100);
            
            console.log("Función graficada exitosamente");
            
        } catch (error) {
            console.error("Error al graficar función:", error);
            mostrarError("Error al graficar la función: " + error.message);
        }
    }

    // Función principal de graficación
    function graficar() {
        const funcionStr = input ? input.value.trim() : '';
        
        if (!funcionStr) {
            mostrarError("Por favor ingresa una función válida");
            return;
        }

        console.log("Graficando función:", funcionStr);
        
        // Mostrar loading
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        // Análisis solo con detección de sigmoide
        const sigmoide = detectarFuncionSigmoide(funcionStr);
        if (sigmoide.esSigmoide) {
            const dominioElement = document.querySelector('#domainResult .result-value');
            const rangoElement = document.querySelector('#rangeResult .result-value');
            const simElement = document.querySelector('#symmetryResult .result-value');
            const absMax = document.getElementById('absoluteMaxima');
            const absMin = document.getElementById('absoluteMinima');
            const localMax = document.getElementById('localMaxima');
            const localMin = document.getElementById('localMinima');
            const inc = document.getElementById('increasingIntervals');
            const dec = document.getElementById('decreasingIntervals');
            const concavaArriba = document.getElementById('concaveUpIntervals');
            const concavaAbajo = document.getElementById('concaveDownIntervals');
            const puntoInflexion = document.getElementById('inflectionPoints');
            const asintotasHorizontales = document.getElementById('horizontalAsymptotes');
            const asintotasVerticales = document.getElementById('verticalAsymptotes');
            const asintotasOblicuas = document.getElementById('obliqueAsymptotes');

            const { N, k, t } = sigmoide;

            if (dominioElement) dominioElement.textContent = "ℝ (todos los números reales)";
            if (rangoElement) rangoElement.textContent = `(0, ${N})`;
            if (simElement) simElement.textContent = "Sin simetría par/impar";
            if (absMax) absMax.textContent = `Supremo = ${N}`;
            if (absMin) absMin.textContent = `Ínfimo = 0`;
            if (localMax) localMax.textContent = "No tiene máximos locales";
            if (localMin) localMin.textContent = "No tiene mínimos locales";
            if (inc) inc.textContent = "(−∞, ∞)";
            if (dec) dec.textContent = "Ninguno";
            if (concavaArriba) concavaArriba.textContent = `(-∞, ${t})`;
            if (concavaAbajo) concavaAbajo.textContent = `(${t}, +∞)`;
            if (puntoInflexion) puntoInflexion.textContent = `${t}`;
            if (asintotasHorizontales) asintotasHorizontales.textContent = `y = 0 y y = ${N}`;
            if (asintotasVerticales) asintotasVerticales.textContent = "No tiene";
            if (asintotasOblicuas) asintotasOblicuas.textContent = "No tiene";

            console.log("Detectada función sigmoide. Análisis completo establecido directamente.");
        } else {
            // Para funciones que no son sigmoide, mostrar mensaje genérico
            const dominioElement = document.querySelector('#domainResult .result-value');
            const rangoElement = document.querySelector('#rangeResult .result-value');
            const simElement = document.querySelector('#symmetryResult .result-value');

            if (dominioElement) dominioElement.textContent = "Análisis no disponible";
            if (rangoElement) rangoElement.textContent = "Análisis no disponible";
            if (simElement) simElement.textContent = "Análisis no disponible";
        }

        // Graficar la función
        graficarFuncion(funcionStr);
        
        
        // Ocultar loading
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }, 1000);
    }

    // Función para convertir función de usuario a formato SymPy
    function convertirFuncionParaSymPy(funcionStr) {
        let funcion = funcionStr.toLowerCase().trim();
        
        // Conversiones básicas para SymPy
        funcion = funcion.replace(/\^/g, '**');  // Potencias
        funcion = funcion.replace(/ln\(/g, 'log(');  // Logaritmo natural
        funcion = funcion.replace(/log\(/g, 'log(');  // Logaritmo
        funcion = funcion.replace(/sqrt\(/g, 'sqrt(');  // Raíz cuadrada
        funcion = funcion.replace(/abs\(/g, 'Abs(');  // Valor absoluto
        funcion = funcion.replace(/exp\(/g, 'exp(');  // Exponencial
        
        // Funciones trigonométricas
        funcion = funcion.replace(/sin\(/g, 'sin(');
        funcion = funcion.replace(/cos\(/g, 'cos(');
        funcion = funcion.replace(/tan\(/g, 'tan(');
        
        // Asegurar multiplicación explícita
        funcion = funcion.replace(/(\d+)([a-z])/g, '$1*$2');
        funcion = funcion.replace(/([a-z])(\d+)/g, '$1*$2');
        funcion = funcion.replace(/\)([a-z])/g, ')*$1');
        
        // Constantes
        funcion = funcion.replace(/\bpi\b/g, 'pi');
        funcion = funcion.replace(/\be\b/g, 'E');
        
        return funcion;
    }

    // Event listeners
    if (btn) {
        btn.addEventListener('click', graficar);
    }

    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                graficar();
            }
        });
    }

    // Botones de operadores
    const operatorButtons = document.querySelectorAll('.operator-btn');
    operatorButtons.forEach(button => {
        button.addEventListener('click', function() {
            const op = this.dataset.op;
            
            if (this.classList.contains('clear-btn')) {
                if (input) input.value = '';
                if (ggbAppReady) {
                    ggbApp.deleteObject("f");
                }
                return;
            }
            
            if (input && op) {
                const cursorPos = input.selectionStart;
                const currentValue = input.value;
                const newValue = currentValue.slice(0, cursorPos) + op + currentValue.slice(cursorPos);
                input.value = newValue;
                
                const newCursorPos = cursorPos + op.length;
                input.setSelectionRange(newCursorPos, newCursorPos);
                input.focus();
            }
        });
    });

    // Manejo de tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Cerrar modal de error
    const closeModal = document.querySelector('.close');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            const errorModal = document.getElementById('errorModal');
            if (errorModal) {
                errorModal.classList.add('hidden');
            }
        });
    }

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('errorModal');
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Inicializar GeoGebra
    initGeoGebra();

});