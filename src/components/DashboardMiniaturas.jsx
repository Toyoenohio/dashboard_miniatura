import React, { useState, useEffect, useMemo, useCallback } from 'react';

// El apiKey se deja vacío, se asume que se manejará con variables de entorno en Cloudflare/Astro.
const apiKey = ""; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// --- CONFIGURACIÓN GLOBAL ---
const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

// NOTA: Se ha eliminado la lógica de inicialización de Firebase/Auth que es específica de Canvas
// para garantizar un despliegue limpio y funcional en Cloudflare Pages / GitHub.

// Función utilitaria para formatear la fecha a 'ddd DD-MM-YY'
const formatDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00');
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const dayOfWeek = days[date.getDay()];

  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear().toString().slice(-2);

  return `${dayOfWeek} ${d}-${m}-${y}`;
};

// --- DATOS SIMULADOS (MOCK DATA) ---
const MOCK_DATA = [
  { fecha: '2025-09-15', canal: 'PopInt', servicio: 'Análisis del nuevo iPhone: ¿Vale la pena en 2025?', cant: 1, enlace: '#', cambios: 1, tipoCambio: 'live' },
  { fecha: '2025-09-17', canal: 'PopInt', servicio: '5 trucos ocultos de iOS 19 que nadie conoce', cant: 1, enlace: '#', cambios: 0, tipoCambio: '' },
  { fecha: '2025-09-22', canal: 'PopInt', servicio: 'Mi primer viaje en tren de alta velocidad | ¡Experiencia épica!', cant: 1, enlace: '#', cambios: 1, tipoCambio: 'post live' },
  { fecha: '2025-09-24', canal: 'PopInt', servicio: 'Guía completa para empezar a programar en React', cant: 1, enlace: '#', cambios: 0, tipoCambio: '' },
  { fecha: '2025-09-25', canal: 'TechFlow', servicio: 'Review de la RTX 5090: La bestia del 2025', cant: 2, enlace: '#', cambios: 3, tipoCambio: 'live' },
  { fecha: '2025-10-01', canal: 'PopInt', servicio: 'Cómo gané 10k en un mes con IA', cant: 1, enlace: '#', cambios: 0, tipoCambio: '' },
  { fecha: '2025-10-05', canal: 'TechFlow', servicio: 'El futuro de las baterías de estado sólido', cant: 1, enlace: '#', cambios: 1, tipoCambio: 'live' },
  { fecha: '2025-10-10', canal: 'GamingX', servicio: 'Top 10 Armas más rotas de Warzone 2025', cant: 1, enlace: '#', cambios: 2, tipoCambio: 'live' },
  { fecha: '2025-11-01', canal: 'GamingX', servicio: 'Primer vistazo a Elden Ring 2: La expansión secreta', cant: 1, enlace: '#', cambios: 0, tipoCambio: 'live' },
];

// Función utilitaria para procesar los datos
const processData = (data, filters) => {
  let filteredData = data.filter(item => {
    const itemMonthYear = item.fecha.substring(0, 7);
    const filterMonthYear = filters.mes;
    if (filterMonthYear && itemMonthYear !== filterMonthYear) return false;

    if (filters.canal && filters.canal !== 'Todos' && item.canal !== filters.canal) return false;

    return true;
  });

  const videos = new Set(filteredData.map(item => item.fecha)).size;
  const miniaturas = filteredData.reduce((sum, item) => sum + item.cant, 0);
  const cambios = filteredData.reduce((sum, item) => sum + item.cambios, 0);
  const totalKPI = miniaturas + cambios;

  const canalesUnicos = [...new Set(filteredData.map(item => item.canal))];
  
  // Data para Gráfico de Miniaturas por Canal
  const miniaturasPorCanal = canalesUnicos.map(canal => ({
    canal,
    count: filteredData.filter(item => item.canal === canal).reduce((sum, item) => sum + item.cant, 0),
  }));
  
  // Data para Gráfico de Cambios por Canal (NUEVO)
  const cambiosPorCanal = canalesUnicos.map(canal => ({
    canal,
    count: filteredData.filter(item => item.canal === canal).reduce((sum, item) => sum + item.cambios, 0),
  }));

  const montoACobrar = (miniaturas * 5) + (cambios * 2);

  return {
    filteredData,
    kpis: { videos, miniaturas, cambios, totalKPI, montoACobrar },
    charts: { miniaturasPorCanal, cambiosPorCanal }, // Incluimos ambos
    canalesUnicos,
  };
};

// Componente para la Tarjeta de KPI
const KpiCard = ({ title, value, unit = '' }) => (
  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}{unit}</p>
  </div>
);

// Componente para el Gráfico de Barras
const BarChart = ({ title, data, total }) => {
  if (data.length === 0 || total === 0) return <p className="text-center text-gray-500 py-10">No hay datos para mostrar.</p>;

  return (
    <div className="p-4 h-full flex flex-col justify-between">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="flex flex-col flex-grow items-start justify-end space-y-4">
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const barColor = CHART_COLORS[index % CHART_COLORS.length];
          return (
            <div key={item.canal} className="w-full flex flex-col">
              <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                <span className="font-bold">{item.canal}</span>
                <span>{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 flex items-center">
                <div
                  className="h-6 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%`, backgroundColor: barColor }}
                ></div>
                <span className="ml-2 text-xs font-semibold text-gray-700">{percentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente para el Gráfico Circular
const PieChart = ({ title, data, total }) => {
  if (data.length === 0 || total === 0) return <p className="text-center text-gray-500 py-10">No hay datos para mostrar.</p>;

  const colors = CHART_COLORS;
  let currentAngle = 0;
  const wedges = data.map((item, index) => {
    const proportion = item.count / total;
    const degrees = proportion * 360;
    const startAngle = currentAngle;
    currentAngle += degrees;
    return {
      color: colors[index % colors.length],
      start: startAngle,
      end: currentAngle,
      label: `${item.canal} (${item.count})`,
    };
  });

  // Generar el conic gradient para el estilo del círculo
  const gradient = wedges.map((wedge) => `${wedge.color} ${wedge.start}deg ${wedge.end}deg`).join(', ');

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="flex-grow flex flex-col sm:flex-row items-center justify-around relative">
        <div
          className="w-40 h-40 sm:w-48 sm:h-48 rounded-full shadow-lg flex-shrink-0"
          style={{
            backgroundImage: `conic-gradient(${gradient})`,
          }}
        >
        </div>
        <div className="sm:ml-8 mt-4 sm:mt-0 p-4 space-y-2 flex-grow">
          {wedges.map((wedge, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <span
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: wedge.color }}
              ></span>
              {wedge.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente Modal para mostrar las ideas de Gemini
const IdeasModal = ({ isOpen, onClose, ideas, loading, error, serviceName, channelName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8">
                <div className="flex justify-between items-start border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">✨ Ideas de Miniaturas para {channelName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 font-semibold">Video/Servicio: <span className="text-gray-800">{serviceName}</span></p>

                {loading && (
                    <div className="text-center py-10">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                        <p className="text-gray-600">Generando ideas virales con IA...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                {!loading && ideas && (
                    <div className="max-h-96 overflow-y-auto pr-2">
                        <p className="font-medium text-gray-700 mb-2">Conceptos sugeridos:</p>
                        {/* Se usa dangerouslySetInnerHTML para renderizar el formato Markdown de Gemini */}
                        <div dangerouslySetInnerHTML={{ __html: ideas.replace(/\n/g, '<br/>') }} className="text-sm text-gray-800 leading-relaxed list-disc pl-5">
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente Principal
const DashboardMiniaturas = () => {
  const [data, setData] = useState(MOCK_DATA);
  const [filters, setFilters] = useState(() => {
    const latestMonth = [...new Set(MOCK_DATA.map(d => d.fecha.substring(0, 7)))].sort().reverse()[0];
    return {
      mes: latestMonth || '2025-09',
      canal: 'Todos',
    };
  });
  
  const [modalState, setModalState] = useState({
      isOpen: false,
      loading: false,
      error: null,
      ideas: null,
      serviceName: '',
      channelName: ''
  });

  // 1. Procesamiento de datos y cálculos
  const { filteredData, kpis, charts, canalesUnicos } = useMemo(() => {
    return processData(data, filters);
  }, [data, filters]);

  const allCanales = useMemo(() => ['Todos', ...new Set(MOCK_DATA.map(d => d.canal))], []);
  const allMeses = useMemo(() => [...new Set(MOCK_DATA.map(d => d.fecha.substring(0, 7)))].sort().reverse(), []);


  // Verificación del mes pasado para etiqueta de costo
  const isMonthPast = useMemo(() => {
    if (!filters.mes) return false;
    const [filterYear, filterMonth] = filters.mes.split('-').map(Number);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    if (filterYear < currentYear) return true;
    if (filterYear === currentYear && filterMonth < currentMonth) return true;
    return false;
  }, [filters.mes]);

  const totalCostLabel = isMonthPast ? 'Monto Cobrado ($):' : 'Monto a Cobrar ($):';

  // Manejadores de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // --- FUNCIÓN DE LA API DE GEMINI CON EXPONENTIAL BACKOFF ---
  const generateThumbnailIdeas = useCallback(async (servicio, canal) => {
    setModalState({ 
        isOpen: true, 
        loading: true, 
        error: null, 
        ideas: null, 
        serviceName: servicio, 
        channelName: canal 
    });

    const systemPrompt = "Actúa como un estratega de contenido viral de YouTube y un experto en miniaturas (thumbnails). Genera 3 ideas de miniaturas creativas, llamativas y orientadas al clic para el siguiente servicio/video. Cada idea debe incluir un concepto visual y un posible texto de superposición. Formatea la respuesta como una lista de viñetas o números.";
    const userQuery = `Video/Servicio: "${servicio}" en el canal de YouTube "${canal}".`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
    };

    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          setModalState(prev => ({ ...prev, loading: false, ideas: text }));
          return; 
        } else {
          throw new Error("Respuesta de la API vacía o malformada.");
        }
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt >= maxRetries) {
          setModalState(prev => ({ ...prev, loading: false, error: "Fallo al generar ideas después de varios reintentos. Inténtalo de nuevo." }));
          return; 
        }
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  const closeModal = () => {
    setModalState({ isOpen: false, loading: false, error: null, ideas: null, serviceName: '', channelName: '' });
  };


  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-['Inter']">
      <div className="max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Dashboard de Miniaturas</h1>

        {/* --- CONTROLES DE FILTRO --- */}
        <div className="flex flex-wrap items-end gap-4 mb-8 bg-gray-50 p-4 rounded-lg border">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Mes:
            <select
              name="mes"
              value={filters.mes}
              onChange={handleFilterChange}
              className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              {allMeses.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Canal:
            <select
              name="canal"
              value={filters.canal}
              onChange={handleFilterChange}
              className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              {allCanales.map(canal => (
                <option key={canal} value={canal}>{canal}</option>
              ))}
            </select>
          </label>

          {/* Etiqueta de costo dinámica */}
          <div className="flex flex-col text-sm font-medium text-gray-700 ml-auto">
            {totalCostLabel}
            <div className="mt-1 p-2 bg-white border border-gray-300 rounded-md font-bold text-xl text-green-600 shadow-inner w-32 text-right">
              {kpis.montoACobrar.toFixed(0)}
            </div>
          </div>
        </div>

        {/* --- TARJETAS DE RESUMEN (KPIs) --- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <KpiCard title="Videos" value={kpis.videos} />
          <KpiCard title="Miniaturas" value={kpis.miniaturas} />
          <KpiCard title="Cambios" value={kpis.cambios} />
          <KpiCard title="Total (Miniaturas + Cambios)" value={kpis.totalKPI} />
        </div>

        {/* --- GRÁFICOS (3 COLUMNAS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* 1. Gráfico de Barras (Miniaturas por Canal) */}
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-md h-96">
            <BarChart
              title="Miniaturas por Canal"
              data={charts.miniaturasPorCanal}
              total={kpis.miniaturas}
            />
          </div>

          {/* 2. Gráfico de Barras (Cambios por Canal) */}
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-md h-96">
            <BarChart
              title="Cambios por Canal"
              data={charts.cambiosPorCanal}
              total={kpis.cambios}
            />
          </div>

          {/* 3. Gráfico Circular (Distribución de Cambios) */}
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-md h-96">
            <PieChart
              title="Distribución de Miniaturas (Torta)"
              data={charts.miniaturasPorCanal}
              total={kpis.miniaturas}
            />
          </div>
        </div>

        {/* --- TABLA DE REGISTROS --- */}
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Registros</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ideas IA</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enlace</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cambios</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de cambio</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((registro, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(registro.fecha)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{registro.canal}</td>
                    <td className="px-4 py-4 max-w-xs truncate text-sm text-gray-600">{registro.servicio}</td>
                    {/* Botón de Ideas IA */}
                    <td className="px-4 py-4 text-center">
                        <button
                            onClick={() => generateThumbnailIdeas(registro.servicio, registro.canal)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-xs shadow-md transition transform hover:scale-105"
                        >
                            ✨ Ideas
                        </button>
                    </td>
                    {/* Enlace con Tooltip de Vista Previa */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <a href={registro.enlace} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition flex items-center group relative">
                            enlace
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-400 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5.656 5.656a2 2 0 10-2.828 2.828l3 3a2 2 0 002.828 0 1 1 0 001.414 1.414 4 4 0 01-5.656 0l-3-3a4 4 0 015.656-5.656l1.5 1.5a1 1 0 101.414-1.414l-1.5-1.5z" clipRule="evenodd" />
                            </svg>
                            <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-300 rounded shadow-lg text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-normal text-center pointer-events-none">
                                Vista Previa Mockup (Requiere API de terceros para generar la previsualización del contenido del enlace).
                            </span>
                        </a>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{registro.cant}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{registro.cambios}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{registro.tipoCambio}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500 text-lg">No se encontraron registros para los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de Ideas */}
        <IdeasModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            ideas={modalState.ideas}
            loading={modalState.loading}
            error={modalState.error}
            serviceName={modalState.serviceName}
            channelName={modalState.channelName}
        />

      </div>
    </div>
  );
};

export default DashboardMiniaturas;
