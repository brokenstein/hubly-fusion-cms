import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { compute } from "@/lib/roi/calc";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/roi/format";
import { SCENARIOS, TEMPLATES, defaultValues, getTemplate } from "@/lib/roi/templates";
import type { Field, ScenarioKey } from "@/lib/roi/types";

export const Route = createFileRoute("/_authenticated/roi")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ROI Calculator — OpsKit workspace" },
      {
        name: "description",
        content:
          "Model investment versus annual gain with scenario multipliers, payback period and three-year value, then save the deal.",
      },
      { property: "og:title", content: "ROI Calculator — OpsKit workspace" },
      {
        property: "og:description",
        content: "Scenario-based ROI modelling with saved deals.",
      },
    ],
  }),
  component: RoiPage,
});

function RoiPage() {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState(TEMPLATES[0]!.id);
  const template = getTemplate(templateId);
  const [scenario, setScenario] = useState<ScenarioKey>("expected");
  const [values, setValues] = useState<Record<string, number>>(() =>
    defaultValues(TEMPLATES[0]!),
  );
  const [dealName, setDealName] = useState("");
  const [company, setCompany] = useState("");

  const selectTemplate = (id: string) => {
    setTemplateId(id);
    setValues(defaultValues(getTemplate(id)));
  };

  const result = useMemo(
    () => compute(template, values, template.scenarios[scenario]),
    [template, values, scenario],
  );

  const deals = useQuery({
    queryKey: ["roi_deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roi_deals")
        .select("id, name, company, template_name, results")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveDeal = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("roi_deals").insert({
        user_id: auth.user!.id,
        name: dealName || `${template.name} scenario`,
        company: company || null,
        template_id: template.id,
        template_name: template.name,
        values,
        results: {
          scenario,
          annualCost: result.annualCost,
          annualGain: result.annualGain,
          netAnnual: result.netAnnual,
          threeYearValue: result.threeYearValue,
          roiPercent: result.roiPercent,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deal saved");
      setDealName("");
      setCompany("");
      queryClient.invalidateQueries({ queryKey: ["roi_deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roi_deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roi_deals"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const renderField = (field: Field) => {
    const value = values[field.key] ?? field.default;
    const display =
      field.type === "currency"
        ? formatCurrency(value)
        : field.type === "percent"
          ? formatPercent(value)
          : `${formatNumber(value)}${field.unit ? ` ${field.unit}` : ""}`;
    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`roi-${field.key}`}>{field.label}</Label>
          <span className="text-sm font-medium tabular-nums">{display}</span>
        </div>
        <Slider
          id={`roi-${field.key}`}
          min={field.min ?? 0}
          max={field.max ?? 1000}
          step={field.step ?? 1}
          value={[value]}
          onValueChange={([next]) => setValues({ ...values, [field.key]: next ?? 0 })}
        />
        {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">ROI Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Model investment against annual gain, then save the scenario as a deal.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTemplate(t.id)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
              t.id === templateId
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card hover:bg-secondary"
            }`}
          >
            <span className="block font-medium">{t.name}</span>
            <span className="block text-xs text-muted-foreground">{t.description}</span>
          </button>
        ))}
      </div>

      <Tabs value={scenario} onValueChange={(v) => setScenario(v as ScenarioKey)}>
        <TabsList>
          {SCENARIOS.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Annual investment" value={formatCurrency(result.annualCost)} />
        <StatCard label="Annual gain" value={formatCurrency(result.annualGain)} />
        <StatCard
          label="Net annual"
          value={formatCurrency(result.netAnnual)}
          hint={`3-year: ${formatCurrency(result.threeYearValue)}`}
        />
        <StatCard
          label="ROI"
          value={formatPercent(result.roiPercent)}
          hint={
            Number.isFinite(result.paybackMonths)
              ? `Payback ${formatNumber(result.paybackMonths, 1)} months`
              : "No payback at these inputs"
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="space-y-5 p-6">
          <h2 className="text-base font-semibold">Investment</h2>
          {template.parameters.map(renderField)}
        </Card>
        <Card className="space-y-5 p-6">
          <h2 className="text-base font-semibold">Returns</h2>
          {template.returns.map(renderField)}
        </Card>
      </section>

      <Card className="space-y-4 p-6">
        <h2 className="text-base font-semibold">Save this scenario</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="deal-name">Deal name</Label>
            <Input
              id="deal-name"
              value={dealName}
              placeholder={`${template.name} scenario`}
              onChange={(e) => setDealName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deal-company">Company</Label>
            <Input
              id="deal-company"
              value={company}
              placeholder="Acme Corp"
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={saveDeal.isPending}
              onClick={() => saveDeal.mutate()}
            >
              {saveDeal.isPending ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Save className="mr-1 size-4" />
              )}
              Save deal
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {(deals.data ?? []).map((deal) => (
            <div
              key={deal.id}
              className="flex items-center gap-3 rounded-md border border-border/60 bg-secondary/40 p-3 text-sm"
            >
              <span className="font-medium">{deal.name}</span>
              {deal.company && (
                <span className="text-xs text-muted-foreground">{deal.company}</span>
              )}
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {formatCurrency(Number((deal.results as Record<string, number>)?.["netAnnual"] ?? 0))}{" "}
                net · {deal.template_name}
              </span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${deal.name}`}
                onClick={() => removeDeal.mutate(deal.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {(deals.data?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No saved deals yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
