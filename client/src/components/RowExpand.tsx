/**
 * Row Expand
 *
 * Renders the row-detail panel shown when a Data Explorer row is expanded.
 * Surfaces hardware, software version, context length, batch size, source
 * citation, measurement date, scaffold (code only), and standardized
 * conditions (image / video / code) per the Phase 1 spec.
 */

import { ExternalLink } from "lucide-react";
import type { DisplayModel } from "@/lib/modelsAdapter";
import { CONFIDENCE_LABEL } from "../../../shared/lib/provenance";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
        {label}
      </span>
      <span className="text-xs text-white/75 font-data">{value}</span>
    </div>
  );
}

export function RowExpand({ model }: { model: DisplayModel }) {
  const dateLabel = model.measurementDate
    ? new Date(model.measurementDate).toISOString().slice(0, 10)
    : null;

  return (
    <div className="bg-white/[0.015] border-t border-white/[0.04] px-6 py-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 mb-4">
        <Field label="Vendor" value={model.vendor} />
        <Field label="Family" value={model.modelFamily} />
        <Field label="Parameters" value={model.parameters} />
        <Field label="Open Weight" value={model.openWeight ? "Yes" : "No"} />

        <Field label="Hardware" value={model.hardware} />
        <Field label="Software Version" value={model.softwareVersion} />
        <Field label="Context Length" value={model.contextLength} />
        <Field label="Batch Size" value={model.batchSize} />

        <Field label="Prompt Class" value={model.promptClass} />
        <Field label="Training/Inference" value={model.trainingOrInference} />
        <Field label="Confidence" value={CONFIDENCE_LABEL[model.confidence]} />
        <Field label="Measurement Date" value={dateLabel} />

        {model.category === "code" ? (
          <>
            <Field label="Scaffold" value={model.scaffold} />
            <Field label="SWE-bench Verified" value={model.sweVerified} />
            <Field label="SWE-bench Pro" value={model.swePro} />
          </>
        ) : null}

        {model.compositeRank ? (
          <Field label={`${model.category.toUpperCase()} Rank`} value={`#${model.compositeRank}`} />
        ) : null}

        {model.statusNote ? <Field label="Status" value={model.statusNote} /> : null}
      </div>

      {/* Source attribution row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-white/[0.04]">
        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
          Source
        </span>
        <a
          href={model.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-teal/80 hover:text-teal underline underline-offset-2"
        >
          {model.sourceName}
          <ExternalLink className="w-3 h-3" />
        </a>
        {model.energyRangeRaw ? (
          <span className="text-[11px] text-white/40">
            Original energy: <span className="font-data text-white/55">{model.energyRangeRaw}</span>
          </span>
        ) : null}
      </div>

      {/* AICo2 methodology fingerprint — Phase 3b */}
      {model.methodologyVersion ? (
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-teal/70 font-display font-bold">
              Methodology
            </span>
            <span className="text-[10px] font-data text-white/40">{model.methodologyVersion}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-[11px]">
            {model.tauApplied != null ? (
              <FingerprintField label="τ applied" value={model.tauApplied.toLocaleString()} />
            ) : null}
            {model.fApplied != null ? (
              <FingerprintField label="F applied" value={model.fApplied.toFixed(2)} />
            ) : null}
            {model.pueApplied != null ? (
              <FingerprintField label="PUE applied" value={model.pueApplied.toFixed(2)} />
            ) : null}
            {model.facilityClass ? (
              <FingerprintField label="Facility class" value={model.facilityClass.replace(/_/g, " ")} />
            ) : null}
            {model.hardwareClass ? (
              <FingerprintField label="Hardware class" value={model.hardwareClass} />
            ) : null}
            {model.gridIntensityGCO2ePerKWh != null ? (
              <FingerprintField
                label="Grid intensity"
                value={`${model.gridIntensityGCO2ePerKWh.toFixed(1)} gCO₂e/kWh`}
              />
            ) : null}
            {model.wueLPerKWh != null ? (
              <FingerprintField label="WUE" value={`${model.wueLPerKWh.toFixed(2)} L/kWh`} />
            ) : null}
          </div>
        </div>
      ) : null}

      {model.notes ? (
        <p className="mt-3 text-[11px] text-white/40 leading-relaxed">{model.notes}</p>
      ) : null}
    </div>
  );
}

function FingerprintField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-white/30 font-medium">
        {label}
      </span>
      <span className="text-[11px] text-white/70 font-data capitalize">{value}</span>
    </div>
  );
}
