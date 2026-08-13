import { TaskStep } from "@/types/database.types";

export interface PipelineStageDefinition {
  order: number;
  layer: "input" | "understanding" | "orchestration" | "preprocessing" | "deep_learning" | "validation" | "response";
  stepName: string;
  description: string;
}

export function buildWorkflowStages(botSlug: string): PipelineStageDefinition[] {
  const basePrefix: PipelineStageDefinition[] = [
    {
      order: 1,
      layer: "input",
      stepName: "Input Validation",
      description: "Validating task payload, schema compliance, and payload bounds",
    },
    {
      order: 2,
      layer: "understanding",
      stepName: "Intent Analysis",
      description: "Analyzing lexical tokens, semantic intent, and execution requirements",
    },
    {
      order: 3,
      layer: "orchestration",
      stepName: "Capability Matching",
      description: "Routing task to specialized execution bot and capability graph",
    },
  ];

  let botSpecificStages: PipelineStageDefinition[] = [];

  switch (botSlug.toLowerCase()) {
    case "visionbot":
      botSpecificStages = [
        {
          order: 4,
          layer: "preprocessing",
          stepName: "Image Decoding & Validation",
          description: "Decoding raw image stream, checking color space and resolution",
        },
        {
          order: 5,
          layer: "deep_learning",
          stepName: "Tensor Transformation & Normalization",
          description: "Constructing normalized 4D tensor [1, 3, 224, 224] with mean/std bounds",
        },
        {
          order: 6,
          layer: "deep_learning",
          stepName: "Spatial Feature Extraction",
          description: "Computing multi-scale convolutional spatial activations and gradients",
        },
        {
          order: 7,
          layer: "deep_learning",
          stepName: "Visual Classification & Inference",
          description: "Evaluating category probability distribution and salience bounds",
        },
      ];
      break;

    case "databot":
      botSpecificStages = [
        {
          order: 4,
          layer: "preprocessing",
          stepName: "Tabular Ingestion & Type Inference",
          description: "Parsing CSV/tabular matrix and resolving numerical column schemas",
        },
        {
          order: 5,
          layer: "deep_learning",
          stepName: "Statistical Distribution Profiling",
          description: "Estimating mean, variance, covariance, and standard deviation matrices",
        },
        {
          order: 6,
          layer: "deep_learning",
          stepName: "Anomaly Detection & Outlier Isolation",
          description: "Multi-dimensional distance scoring and isolation thresholding",
        },
      ];
      break;

    case "codebot":
      botSpecificStages = [
        {
          order: 4,
          layer: "deep_learning",
          stepName: "Lexical Parsing & AST Construction",
          description: "Constructing Abstract Syntax Tree and verifying grammar specifications",
        },
        {
          order: 5,
          layer: "deep_learning",
          stepName: "Complexity & Security Profiling",
          description: "Evaluating cyclomatic complexity and static security heuristics",
        },
        {
          order: 6,
          layer: "deep_learning",
          stepName: "Algorithmic Synthesis & Refinement",
          description: "Formulating optimized code structure and type definitions",
        },
      ];
      break;

    case "researchbot":
      botSpecificStages = [
        {
          order: 4,
          layer: "deep_learning",
          stepName: "Literature Query Decomposition",
          description: "Parsing semantic queries, thematic scopes, and reference anchors",
        },
        {
          order: 5,
          layer: "deep_learning",
          stepName: "Semantic Synthesis & Citation Extraction",
          description: "Computing contextual similarity rankings across theoretical nodes",
        },
      ];
      break;

    case "documentbot":
      botSpecificStages = [
        {
          order: 4,
          layer: "preprocessing",
          stepName: "Document Chunking & Structure Parsing",
          description: "Segmenting hierarchical headers, paragraphs, and data tables",
        },
        {
          order: 5,
          layer: "deep_learning",
          stepName: "Hierarchical Entity Extraction",
          description: "Distilling key structural data entities and semantic summaries",
        },
      ];
      break;

    case "studybot":
      botSpecificStages = [
        {
          order: 4,
          layer: "deep_learning",
          stepName: "Pedagogical Deconstruction",
          description: "Deconstructing core concept into foundational axioms and prerequisites",
        },
        {
          order: 5,
          layer: "deep_learning",
          stepName: "Step-by-Step Concept Synthesis",
          description: "Building interactive mental model and verification checkpoints",
        },
      ];
      break;

    default: // chatbot
      botSpecificStages = [
        {
          order: 4,
          layer: "preprocessing",
          stepName: "Text Preprocessing & Tokenization",
          description: "Cleaning text, removing stop-patterns, and building token sequences",
        },
        {
          order: 5,
          layer: "deep_learning",
          stepName: "Semantic Feature Extraction",
          description: "Projecting token sequence into dense continuous vector space",
        },
        {
          order: 6,
          layer: "deep_learning",
          stepName: "Contextual Inference",
          description: "Executing multi-head semantic reasoning and attention weighting",
        },
      ];
      break;
  }

  const baseSuffix: PipelineStageDefinition[] = [
    {
      order: basePrefix.length + botSpecificStages.length + 1,
      layer: "validation",
      stepName: "Result Validation",
      description: "Validating output schema, consistency, and safety guarantees",
    },
    {
      order: basePrefix.length + botSpecificStages.length + 2,
      layer: "response",
      stepName: "Response Finalization",
      description: "Assembling final artifact response and committing execution trace",
    },
  ];

  return [...basePrefix, ...botSpecificStages, ...baseSuffix];
}

export function createInitialTaskSteps(taskId: string, botSlug: string): TaskStep[] {
  const stages = buildWorkflowStages(botSlug);
  return stages.map((stage) => ({
    id: `step-${taskId}-${stage.order}`,
    task_id: taskId,
    step_order: stage.order,
    layer: stage.layer,
    step_name: stage.stepName,
    status: "waiting",
    progress: 0,
    message: stage.description,
    metadata: {},
    started_at: null,
    completed_at: null,
    duration_ms: null,
    created_at: new Date().toISOString(),
  }));
}
