"use client";

import { useState } from "react";
import { GenericImageForm } from "./generic-image-form";
import { DynamicModelForm } from "./dynamic-model-form";
import { getCloudflareModel } from "@/lib/cloudflare-models";
import { IMAGE_MODELS, type ImageModelId } from "@/lib/constants";

export function TextToImageForm({
  onCreated,
  busy,
}: {
  onCreated: (jobId: string) => void;
  busy: boolean;
}) {
  const [model, setModel] = useState<ImageModelId>(IMAGE_MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const dynamicConfig = getCloudflareModel(model);

  if (dynamicConfig && dynamicConfig.category === "text-to-image") {
    return (
      <DynamicModelForm
        key={model}
        config={dynamicConfig}
        mode="text-to-image"
        models={IMAGE_MODELS}
        model={model}
        onModelChange={setModel}
        initialPrompt={prompt}
        onPromptChange={setPrompt}
        onCreated={onCreated}
        busy={busy}
      />
    );
  }

  return (
    <GenericImageForm
      key={model}
      models={IMAGE_MODELS}
      model={model}
      onModelChange={setModel}
      initialPrompt={prompt}
      onPromptChange={setPrompt}
      onCreated={onCreated}
      busy={busy}
    />
  );
}
