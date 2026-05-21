import { REPORT_STATUS } from '../../utils/constants.js';

export function ReportStatusBadge({ status }) {
  const config = REPORT_STATUS[status];
  if (!config) return null;
  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
}
