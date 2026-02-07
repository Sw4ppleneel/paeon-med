import { motion } from 'motion/react';
import { CheckCircle, AlertTriangle, Shield, AlertCircle } from 'lucide-react';

interface ComplianceCardProps {
  complianceData?: {
    regulatory: {
      status: string;
      authority: string;
      icon: string;
    };
    pregnancy: {
      category: string;
      icon: string;
    };
    boxedWarning: {
      status: string;
      icon: string;
    };
    citations: string[];
  };
}

export function ComplianceCard({ complianceData }: ComplianceCardProps) {
  if (!complianceData) return null;

  const getIcon = (iconType: string) => {
    const iconMap: Record<string, any> = {
      check: CheckCircle,
      warning: AlertTriangle,
      shield: Shield,
      alert: AlertCircle,
    };
    return iconMap[iconType] || CheckCircle;
  };

  const safetyItems = [
    {
      title: 'FDA/CDSCO Status',
      value: complianceData.regulatory.status,
      authority: complianceData.regulatory.authority,
      icon: getIcon(complianceData.regulatory.icon),
      color: '#2E7D32',
    },
    {
      title: 'Pregnancy Category',
      value: complianceData.pregnancy.category,
      authority: 'Risk Assessment',
      icon: getIcon(complianceData.pregnancy.icon),
      color: '#F57F17',
    },
    {
      title: 'Boxed Warning',
      value: complianceData.boxedWarning.status,
      authority: 'FDA Black Box',
      icon: getIcon(complianceData.boxedWarning.icon),
      color: complianceData.boxedWarning.status === 'None' ? '#2E7D32' : '#D32F2F',
    },
  ];

  return (
    <div id="compliance" className="scroll-mt-32">
      {/* Section Header */}
      <div className="mb-8">
        <h3 
          className="text-3xl font-bold tracking-tight text-black"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Regulatory & Safety
        </h3>
        <p 
          className="mt-2 text-base font-normal text-black/50"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Compliance status and safety profile
        </p>
      </div>

      {/* Safety Dashboard Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {safetyItems.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <motion.div
              key={index}
              className="rounded-[28px] p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(60px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)'
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
            >
              {/* Icon */}
              <div 
                className="mb-6 inline-flex items-center justify-center rounded-2xl p-3"
                style={{
                  background: `${item.color}15`,
                }}
              >
                <Icon size={28} style={{ color: item.color }} strokeWidth={2} />
              </div>

              {/* Title */}
              <h4 
                className="mb-2 text-sm font-normal uppercase tracking-wider text-black/60"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                {item.title}
              </h4>

              {/* Value */}
              <p 
                className="mb-1 text-2xl font-bold text-black/90"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                {item.value}
              </p>

              {/* Authority */}
              <p 
                className="text-xs font-normal text-black/40"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                {item.authority}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Citations Footer */}
      <motion.div
        className="rounded-[24px] p-6"
        style={{
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        <p 
          className="mb-3 text-xs font-normal uppercase tracking-wider text-black/50"
          style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
        >
          Sources & Citations
        </p>
        <div className="flex flex-col gap-1">
          {complianceData.citations.map((citation, index) => (
            <p 
              key={index}
              className="text-sm font-semibold text-black/60"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {citation}
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}