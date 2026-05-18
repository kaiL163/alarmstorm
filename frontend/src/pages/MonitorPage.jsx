import { Activity, AlertTriangle, ArrowLeft, Cpu, Droplets, Eye, Fan, Gauge, Server, Thermometer, Waves, Wind, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('ru-RU')
}

function AlarmCard({ alarm }) {
  const isCritical = alarm.priority === 'High'
  return (
    <div className={[
      'rounded-lg border p-3',
      isCritical ? 'border-[#ef4444]/30 bg-[#2a111b]' : 'border-[#facc15]/25 bg-[#241f10]',
    ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={['text-[10px] font-black uppercase', isCritical ? 'text-[#ff4055]' : 'text-[#facc15]'].join(' ')}>
          {isCritical ? 'Critical' : 'Warning'}
        </span>
        <span className="font-mono text-[10px] text-[#687385]">{alarm.timestamp}</span>
      </div>
      <p className="mt-2 truncate text-[11px] font-bold text-white">{alarm.tag}</p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#9ca3af]">{alarm.message}</p>
    </div>
  )
}

function KpiCard({ title, value, unit, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-[#20283a] bg-[#101725] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7f8da3]">{title}</p>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="mt-4 flex items-end gap-1">
        <span className="font-mono text-2xl font-black" style={{ color }}>{value}</span>
        <span className="pb-1 text-[11px] font-bold text-[#687385]">{unit}</span>
      </div>
      <div className="mt-4 h-1 rounded-full bg-[#1b2230]">
        <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: color }} />
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const label = {
    critical: 'Critical',
    warning: 'Warning',
    offline: 'Offline',
    ok: 'Online',
  }[status] ?? 'Online'
  const className = {
    critical: 'border-[#ef4444]/40 bg-[#3a1420] text-[#ff4055]',
    warning: 'border-[#facc15]/35 bg-[#2a220f] text-[#facc15]',
    offline: 'border-[#64748b]/35 bg-[#1e293b] text-[#94a3b8]',
    ok: 'border-[#00f5b8]/30 bg-[#06251d] text-[#00f5b8]',
  }[status] ?? 'border-[#00f5b8]/30 bg-[#06251d] text-[#00f5b8]'

  return <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${className}`}>{label}</span>
}

function getEquipmentMetrics(item) {
  if (item.name.includes('Compressor')) {
    return [
      { label: 'Speed', value: item.speed ? formatNumber(item.speed) : 'N/A', unit: item.speed ? 'RPM' : '' },
      { label: 'Power', value: item.power, unit: 'MW' },
      { label: 'Efficiency', value: item.efficiency, unit: '%' },
      { label: 'Vibration', value: item.vibration, unit: 'mm/s', warning: item.vibration >= 6 },
    ]
  }

  if (item.name.includes('Pump')) {
    return [
      { label: 'Flow', value: item.speed ? (item.speed / 12).toFixed(0) : 0, unit: 'm³/h' },
      { label: 'Power', value: item.power, unit: 'MW' },
      { label: 'Suction', value: (2.5 + item.power).toFixed(1), unit: 'barg' },
      { label: 'Vibration', value: item.vibration, unit: 'mm/s', warning: item.vibration >= 6 },
    ]
  }

  if (item.name.includes('Turbine')) {
    return [
      { label: 'Speed', value: item.speed ? formatNumber(item.speed) : 'N/A', unit: item.speed ? 'RPM' : '' },
      { label: 'Power', value: item.power, unit: 'MW' },
      { label: 'Exhaust', value: (430 + item.vibration * 7).toFixed(0), unit: '°C', warning: item.status === 'warning' },
      { label: 'Efficiency', value: item.efficiency, unit: '%' },
    ]
  }

  if (item.name.includes('Fan')) {
    return [
      { label: 'Fan Speed', value: item.speed ? formatNumber(item.speed) : 'N/A', unit: item.speed ? 'RPM' : '' },
      { label: 'Motor', value: item.power, unit: 'MW' },
      { label: 'Airflow', value: item.speed ? (item.speed * 1.8).toFixed(0) : 0, unit: 'm³/h' },
      { label: 'Vibration', value: item.vibration, unit: 'mm/s', warning: item.vibration >= 6 },
    ]
  }

  return [
    { label: 'Load', value: item.power, unit: 'MW' },
    { label: 'Oil Temp', value: (58 + item.vibration * 4).toFixed(1), unit: '°C' },
    { label: 'Efficiency', value: item.efficiency, unit: '%' },
    { label: 'Vibration', value: item.vibration, unit: 'mm/s' },
  ]
}

function EquipmentRow({ item, onSelect }) {
  const metrics = getEquipmentMetrics(item)

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="group grid w-full grid-cols-[1fr_repeat(4,86px)] items-center gap-4 rounded-lg bg-[#172033] px-4 py-3 text-left transition hover:bg-[#1d2940] hover:ring-1 hover:ring-[#00f5b8]/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b111d]">
          <Server className="h-5 w-5 text-[#687385] group-hover:hidden" />
          <Eye className="hidden h-5 w-5 text-[#00f5b8] group-hover:block" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-black text-white">{item.id}</p>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-[11px] text-[#8b96a8]">{item.name}</p>
        </div>
      </div>
      {metrics.map((metric) => (
        <Metric key={metric.label} {...metric} />
      ))}
    </button>
  )
}

function Metric({ label, value, unit, warning }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-wide text-[#687385]">{label}</p>
      <p className={['mt-1 font-mono text-[12px] font-black', warning ? 'text-[#facc15]' : 'text-[#cbd5e1]'].join(' ')}>
        {value} <span className="text-[9px] text-[#687385]">{unit}</span>
      </p>
    </div>
  )
}

function TrendCard({ title, data, color, unit }) {
  return (
    <div className="rounded-xl border border-[#20283a] bg-[#101725] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-black text-white">{title} ({unit})</p>
        <span className="flex items-center gap-1 text-[9px] uppercase text-[#687385]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          Live
        </span>
      </div>
      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              contentStyle={{ background: '#0b111d', border: '1px solid #20283a', borderRadius: 8, color: '#fff' }}
              labelStyle={{ color: '#8b96a8' }}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function getEquipmentDetail(item) {
  if (item.name.includes('Compressor')) {
    return {
      title: 'Centrifugal Compressor',
      center: 'CENTRIFUGAL\nCOMPRESSOR',
      accent: '#ff4055',
      state: item.status === 'critical' ? 'FAULT DETECTED' : 'NORMAL OPERATION',
      modules: [
        { label: 'Air Intake', icon: Wind },
        { label: 'Gas Cooler', icon: Waves },
      ],
      sensors: [
        { label: 'Vibration Z', value: item.vibration, unit: 'mm/s', color: '#ff4055', icon: Activity, slot: 'top-left' },
        { label: 'Discharge Temp', value: (152 + item.vibration * 0.4).toFixed(1), unit: '°C', color: '#facc15', icon: Thermometer, slot: 'top-right' },
        { label: 'Inlet Press', value: (39 + item.power).toFixed(1), unit: 'barg', color: '#00d4a6', icon: Gauge, slot: 'bottom-left' },
        { label: 'Lube Oil Press', value: (2 + item.vibration * 0.08).toFixed(1), unit: 'barg', color: '#facc15', icon: Droplets, slot: 'bottom-center' },
        { label: 'Outlet Press', value: (148 + item.power).toFixed(1), unit: 'barg', color: '#00d4a6', icon: Gauge, slot: 'bottom-right' },
      ],
    }
  }

  if (item.name.includes('Pump')) {
    return {
      title: 'Reciprocating Pump',
      center: 'RECIPROCATING\nPUMP',
      accent: '#3b82f6',
      state: item.status === 'offline' ? 'STANDBY MODE' : 'FLOW CONTROL ACTIVE',
      modules: [
        { label: 'Suction Line', icon: Droplets },
        { label: 'Discharge Line', icon: Gauge },
      ],
      sensors: [
        { label: 'Suction Press', value: (2.5 + item.power).toFixed(1), unit: 'barg', color: '#00d4a6', icon: Gauge, slot: 'top-left' },
        { label: 'Flow Rate', value: item.speed ? (item.speed / 12).toFixed(0) : 0, unit: 'm³/h', color: '#3b82f6', icon: Droplets, slot: 'top-right' },
        { label: 'Vibration', value: item.vibration, unit: 'mm/s', color: item.vibration >= 6 ? '#facc15' : '#00d4a6', icon: Activity, slot: 'bottom-left' },
        { label: 'Motor Load', value: (item.power * 42).toFixed(0), unit: '%', color: '#facc15', icon: Zap, slot: 'bottom-right' },
      ],
    }
  }

  if (item.name.includes('Turbine')) {
    return {
      title: 'Gas Turbine',
      center: 'GAS\nTURBINE',
      accent: '#facc15',
      state: item.status === 'warning' ? 'LOAD WARNING' : 'TURBINE STABLE',
      modules: [
        { label: 'Combustor', icon: Zap },
        { label: 'Exhaust', icon: Wind },
      ],
      sensors: [
        { label: 'Rotor Speed', value: formatNumber(item.speed), unit: 'RPM', color: '#00f5b8', icon: Gauge, slot: 'top-left' },
        { label: 'Exhaust Temp', value: (430 + item.vibration * 7).toFixed(0), unit: '°C', color: '#facc15', icon: Thermometer, slot: 'top-right' },
        { label: 'Power', value: item.power, unit: 'MW', color: '#3b82f6', icon: Zap, slot: 'bottom-left' },
        { label: 'Efficiency', value: item.efficiency, unit: '%', color: '#00d4a6', icon: Activity, slot: 'bottom-right' },
      ],
    }
  }

  if (item.name.includes('Fan')) {
    return {
      title: 'Cooling Tower Fan',
      center: 'COOLING\nFAN',
      accent: '#00d4a6',
      state: item.status === 'warning' ? 'COOLING WARNING' : 'AIRFLOW STABLE',
      modules: [
        { label: 'Air Flow', icon: Fan },
        { label: 'Cooling Cell', icon: Thermometer },
      ],
      sensors: [
        { label: 'Fan Speed', value: formatNumber(item.speed), unit: 'RPM', color: '#00f5b8', icon: Fan, slot: 'top-left' },
        { label: 'Motor Power', value: item.power, unit: 'MW', color: '#3b82f6', icon: Zap, slot: 'top-right' },
        { label: 'Vibration', value: item.vibration, unit: 'mm/s', color: item.vibration >= 6 ? '#facc15' : '#00d4a6', icon: Activity, slot: 'bottom-left' },
        { label: 'Efficiency', value: item.efficiency, unit: '%', color: '#00d4a6', icon: Gauge, slot: 'bottom-right' },
      ],
    }
  }

  return {
    title: 'Main Transformer',
    center: 'MAIN\nTRANSFORMER',
    accent: '#8b5cf6',
    state: 'POWER DISTRIBUTION',
    modules: [
      { label: 'Primary Bus', icon: Zap },
      { label: 'Cooling Oil', icon: Droplets },
    ],
    sensors: [
      { label: 'Load', value: item.power, unit: 'MW', color: '#3b82f6', icon: Zap, slot: 'top-left' },
      { label: 'Oil Temp', value: (58 + item.vibration * 4).toFixed(1), unit: '°C', color: '#facc15', icon: Thermometer, slot: 'top-right' },
      { label: 'Efficiency', value: item.efficiency, unit: '%', color: '#00d4a6', icon: Activity, slot: 'bottom-left' },
      { label: 'Vibration', value: item.vibration, unit: 'mm/s', color: '#8b5cf6', icon: Activity, slot: 'bottom-right' },
    ],
  }
}

function EquipmentDetail({ item, onBack }) {
  const detail = getEquipmentDetail(item)
  const isFault = item.status === 'critical' || item.status === 'warning'
  const LeftModuleIcon = detail.modules[0].icon
  const RightModuleIcon = detail.modules[1].icon
  const sensorSlotClass = {
    'top-left': 'col-start-2 row-start-1 justify-self-start',
    'top-right': 'col-start-4 row-start-1 justify-self-end',
    'bottom-left': 'col-start-1 row-start-3 justify-self-start',
    'bottom-center': 'col-start-3 row-start-3 justify-self-center',
    'bottom-right': 'col-start-5 row-start-3 justify-self-end',
  }

  return (
    <section className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
      <div className="flex items-center gap-3 border-b border-[#1b2230] pb-4">
        <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#172033] text-[#8b96a8] transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-black text-white">{item.id}</h2>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-[11px] text-[#8b96a8]">{detail.title}</p>
        </div>
      </div>

      <div className="mt-5 min-h-[470px] rounded-xl bg-[#080d16] p-6">
        <div className="mx-auto grid h-[430px] max-w-[720px] grid-cols-5 grid-rows-[96px_150px_96px] items-center gap-x-4 gap-y-8">
          {detail.sensors.map((sensor) => {
            const Icon = sensor.icon
            return (
              <div
                key={sensor.label}
                className={`w-[150px] rounded-lg border bg-[#101725] p-3 ${sensorSlotClass[sensor.slot] ?? ''}`}
                style={{ borderColor: `${sensor.color}66`, boxShadow: `0 0 16px ${sensor.color}18` }}
              >
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-[#7f8da3]">
                  <Icon className="h-3 w-3" style={{ color: sensor.color }} />
                  {sensor.label}
                </div>
                <p className="mt-2 font-mono text-lg font-black" style={{ color: sensor.color }}>
                  {sensor.value}<span className="ml-1 text-[10px] text-[#687385]">{sensor.unit}</span>
                </p>
              </div>
            )
          })}

          <div className="col-start-1 row-start-2 flex h-[120px] w-[150px] flex-col items-center justify-center rounded-lg bg-[#131c2e] text-center">
            <LeftModuleIcon className="h-7 w-7 text-[#687385]" />
            <p className="mt-3 text-[10px] font-black uppercase text-[#687385]">{detail.modules[0].label}</p>
          </div>
          <div className="col-start-5 row-start-2 flex h-[120px] w-[150px] flex-col items-center justify-center rounded-lg bg-[#131c2e] text-center">
            <RightModuleIcon className="h-7 w-7 text-[#687385]" />
            <p className="mt-3 text-[10px] font-black uppercase text-[#687385]">{detail.modules[1].label}</p>
          </div>

          <div
            className="col-span-3 col-start-2 row-start-2 mx-auto flex h-[120px] w-[210px] flex-col items-center justify-center rounded-xl border bg-[#111827] text-center"
            style={{ borderColor: detail.accent, boxShadow: `0 0 22px ${detail.accent}20` }}
          >
            <Activity className="h-5 w-5" style={{ color: detail.accent }} />
            <p className="mt-3 whitespace-pre-line text-[12px] font-black uppercase leading-4 text-white">{detail.center}</p>
            <p className="mt-2 text-[9px] font-black uppercase" style={{ color: isFault ? '#ff4055' : '#00f5b8' }}>{detail.state}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function MonitorPage() {
  const { alarms, monitor, loading, error, selectedDate, loadMonitor } = useAlarmData()
  const [liveTrends, setLiveTrends] = useState({})
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null)
  const liveDateRef = useRef('')
  const liveUpdateRef = useRef('')
  const isLiveDate = selectedDate?.slice(8, 10) === '14'
  const activeAlarms = useMemo(() => [...alarms]
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    .slice(0, 7), [alarms])

  useEffect(() => {
    if (!selectedDate || error || !isLiveDate) return undefined
    const interval = setInterval(() => {
      loadMonitor(selectedDate)
    }, 3000)
    return () => clearInterval(interval)
  }, [error, isLiveDate, loadMonitor, selectedDate])

  useEffect(() => {
    setSelectedEquipmentId(null)
  }, [selectedDate])

  useEffect(() => {
    if (!monitor?.trends) return

    if (liveDateRef.current !== selectedDate || !isLiveDate) {
      liveDateRef.current = selectedDate
      liveUpdateRef.current = monitor.updated_at
      setLiveTrends(monitor.trends)
      return
    }

    if (!monitor.updated_at || liveUpdateRef.current === monitor.updated_at) return

    liveUpdateRef.current = monitor.updated_at
    const time = new Date(monitor.updated_at).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    setLiveTrends((current) => {
      const next = { ...current }
      ;['vibration', 'pressure', 'oil_temperature'].forEach((key) => {
        const sourceSeries = monitor.trends[key] ?? []
        const currentSeries = current[key] ?? []
        const latest = sourceSeries.at(-1)

        if (!latest) {
          next[key] = currentSeries
          return
        }

        next[key] = [...currentSeries.slice(-29), { ...latest, time }]
      })
      return next
    })
  }, [isLiveDate, monitor?.trends, monitor?.updated_at, selectedDate])

  if (loading) return <div className="text-[#8b96a8]">Загрузка мониторинга...</div>
  if (error) return <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 p-5 text-[#ef4444]">{error}</div>

  const kpis = monitor?.kpis ?? {}
  const equipment = monitor?.equipment ?? []
  const selectedEquipment = equipment.find((item) => item.id === selectedEquipmentId)
  const trends = liveTrends

  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
      <section className="rounded-xl border border-[#20283a] bg-[#101725] p-3">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b96a8]">Активные тревоги</h1>
          <span className="shrink-0 whitespace-nowrap rounded-full border border-[#263247] px-2 py-0.5 text-[9px] text-[#687385]">{selectedDate}</span>
        </div>
        <div className="space-y-2">
          {activeAlarms.map((alarm) => <AlarmCard key={alarm.id} alarm={alarm} />)}
          {!activeAlarms.length && <div className="rounded-lg border border-[#263247] bg-[#0b111d] p-4 text-[11px] text-[#8b96a8]">Активных тревог нет</div>}
        </div>
      </section>

      <div className="space-y-4">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="System Speed Avg" value={formatNumber(kpis.system_speed)} unit="RPM" icon={Cpu} color="#00f5b8" />
          <KpiCard title="Total Motor Power" value={kpis.total_motor_power ?? 0} unit="MW" icon={Zap} color="#3b82f6" />
          <KpiCard title="Plant Efficiency" value={kpis.plant_efficiency ?? 0} unit="%" icon={Activity} color="#facc15" />
          <KpiCard title="Vibration Peak" value={kpis.vibration_peak ?? 0} unit="mm/s" icon={AlertTriangle} color="#ff4055" />
        </section>

        {selectedEquipment ? (
          <EquipmentDetail item={selectedEquipment} onBack={() => setSelectedEquipmentId(null)} />
        ) : (
          <section className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
            <h2 className="mb-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#8b96a8]">Оборудование</h2>
            <div className="space-y-3 overflow-x-auto">
              <div className="min-w-[720px] space-y-3">
                {equipment.map((item) => <EquipmentRow key={item.id} item={item} onSelect={setSelectedEquipmentId} />)}
              </div>
            </div>
          </section>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b96a8]">Live тренды</h2>
        <TrendCard title="Vibration Z-Axis" data={trends.vibration ?? []} color="#ff4055" unit="mm/s" />
        <TrendCard title="Discharge Pressure" data={trends.pressure ?? []} color="#00d4a6" unit="barg" />
        <TrendCard title="Lube Oil Temp" data={trends.oil_temperature ?? []} color="#facc15" unit="°C" />
      </section>
    </div>
  )
}

export default MonitorPage
