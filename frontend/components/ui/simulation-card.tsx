interface SimulationCardProps {
  title: string
  metrics: {
    components: number
    connectivity: string
    population: string
    investment: string
  }
  status: string
  isPrimary?: boolean
}

export default function SimulationCard({ title, metrics, status, isPrimary }: SimulationCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${isPrimary ? "border-2 border-pathcycle-primary" : "border-pathcycle-gray-100"} flex flex-col`}
    >
      <div
        className={`h-12 flex items-center px-4 rounded-t-lg border-b ${isPrimary ? "bg-pathcycle-primary/10 text-pathcycle-primary" : "bg-pathcycle-gray-100"}`}
      >
        <h2 className="font-bold">{title}</h2>
      </div>

      <div className="flex-1 relative min-h-[300px] bg-pathcycle-gray-50 flex items-center justify-center">
        <span className="text-pathcycle-gray-400">[Mapa]</span>

        <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md border border-pathcycle-gray-100">
          <h3 className="font-bold text-sm mb-2 uppercase">Métricas</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              Componentes: <span className="float-right font-medium">{metrics.components}</span>
            </p>
            <p>
              Conectividad: <span className="float-right font-medium">{metrics.connectivity}</span>
            </p>
            <p>
              Población: <span className="float-right font-medium">{metrics.population}</span>
            </p>
            <p>
              Inversión: <span className="float-right font-medium">{metrics.investment}</span>
            </p>
          </div>
          <div className="border-t border-pathcycle-gray-200 pt-2 mt-2">
            <p>
              Estado:{" "}
              <span
                className={`float-right font-medium ${status === "Conectado" ? "text-pathcycle-secondary" : "text-pathcycle-accent"}`}
              >
                {status}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
