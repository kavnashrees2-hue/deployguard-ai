import { AnalysisResult, FailureCategory, Severity } from '../types';
import { ERROR_SIGNATURES, ErrorSignature } from './errorSignatures';

export interface MatchScore {
  signature: ErrorSignature;
  patternMatchCount: number;
  keywordScore: number;
  totalScore: number;
  matchedLines: { lineNumber: number; content: string }[];
}

export class RuleBasedLogAnalyzer {
  /**
   * Analyzes raw log text and returns a structured root cause and remediation runbook.
   * Completely deterministic, offline, and instant.
   */
  public static analyze(rawLogs: string): AnalysisResult {
    if (!rawLogs || rawLogs.trim().length === 0) {
      return this.generateEmptyResult();
    }

    const lines = rawLogs.split(/\r?\n/);
    const scores: MatchScore[] = [];

    // Evaluate each known error signature
    for (const signature of ERROR_SIGNATURES) {
      const matchResult = this.evaluateSignature(signature, lines);
      if (matchResult.totalScore > 0) {
        scores.push(matchResult);
      }
    }

    // Sort by total score descending
    scores.sort((a, b) => b.totalScore - a.totalScore);

    if (scores.length > 0 && scores[0].totalScore >= 20) {
      const best = scores[0];
      // Confidence score clamped between 65% and 99% for solid matches
      const confidenceScore = Math.min(
        99,
        Math.max(65, Math.round(50 + best.totalScore / 2))
      );

      return {
        signatureId: best.signature.id,
        ruleName: best.signature.name,
        category: best.signature.category,
        severity: best.signature.severity,
        confidenceScore,
        summary: best.signature.summary,
        rootCause: best.signature.rootCause,
        detectedPattern: best.signature.patterns[0]?.source || 'Pattern matched',
        affectedComponent: best.signature.affectedComponent,
        remediationSteps: best.signature.remediationSteps,
        preventativeMeasures: best.signature.preventativeMeasures,
        docLinks: best.signature.docLinks,
        matchedLines: best.matchedLines.slice(0, 5),
        analysisEngine: 'RULE_ENGINE_LOCAL',
        analyzedAt: new Date().toISOString()
      };
    }

    // Fallback: heuristic analysis for unknown errors
    return this.runHeuristicAnalysis(lines, rawLogs);
  }

  private static evaluateSignature(
    signature: ErrorSignature,
    lines: string[]
  ): MatchScore {
    let patternMatchCount = 0;
    let keywordScore = 0;
    const matchedLinesMap = new Map<number, string>();

    // 1. Check regex patterns
    lines.forEach((line, index) => {
      for (const pattern of signature.patterns) {
        if (pattern.test(line)) {
          patternMatchCount++;
          matchedLinesMap.set(index + 1, line.trim());
          break;
        }
      }
    });

    // 2. Check keyword weight map across entire text
    const fullTextLower = lines.join(' ').toLowerCase();
    for (const [keyword, weight] of Object.entries(signature.keywordWeightMap)) {
      if (fullTextLower.includes(keyword.toLowerCase())) {
        keywordScore += weight;
      }
    }

    const totalScore = patternMatchCount * 30 + keywordScore;

    return {
      signature,
      patternMatchCount,
      keywordScore,
      totalScore,
      matchedLines: Array.from(matchedLinesMap.entries()).map(([lineNumber, content]) => ({
        lineNumber,
        content
      }))
    };
  }

  private static runHeuristicAnalysis(lines: string[], rawLogs: string): AnalysisResult {
    const errorLines: { lineNumber: number; content: string }[] = [];
    const errorKeywords = ['error', 'fatal', 'exception', 'failed', 'failure', 'panic', 'abort'];

    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      if (errorKeywords.some((kw) => lower.includes(kw))) {
        errorLines.push({ lineNumber: index + 1, content: line.trim() });
      }
    });

    let detectedCategory: FailureCategory = 'APPLICATION';
    let detectedSeverity: Severity = 'MEDIUM';
    const lowerFull = rawLogs.toLowerCase();

    if (lowerFull.includes('killed') || lowerFull.includes('sigterm') || lowerFull.includes('segmentation fault')) {
      detectedCategory = 'INFRASTRUCTURE';
      detectedSeverity = 'CRITICAL';
    } else if (lowerFull.includes('sql') || lowerFull.includes('database') || lowerFull.includes('mongo') || lowerFull.includes('postgres')) {
      detectedCategory = 'DATABASE';
      detectedSeverity = 'HIGH';
    } else if (lowerFull.includes('connect') || lowerFull.includes('network') || lowerFull.includes('dns') || lowerFull.includes('socket')) {
      detectedCategory = 'NETWORK';
      detectedSeverity = 'HIGH';
    } else if (lowerFull.includes('permission') || lowerFull.includes('unauthorized') || lowerFull.includes('token') || lowerFull.includes('auth')) {
      detectedCategory = 'SECURITY';
      detectedSeverity = 'HIGH';
    }

    const firstError = errorLines[0]?.content || 'Unidentified failure logged during execution.';

    return {
      signatureId: 'GENERIC_RUNTIME_FAILURE',
      ruleName: 'Generic Application / Runtime Failure',
      category: detectedCategory,
      severity: detectedSeverity,
      confidenceScore: errorLines.length > 0 ? 58 : 35,
      summary: `Detected unexpected runtime failure or non-zero exit state in logs: "${firstError.slice(0, 120)}..."`,
      rootCause: 'The application encountered an uncaught runtime exception or process crash without matching a specific predefined infrastructure signature.',
      detectedPattern: 'Generic error/failure keyword heuristic',
      affectedComponent: 'Application Runtime / Entrypoint',
      remediationSteps: [
        {
          step: 1,
          title: 'Review highlighted error lines in the stack trace',
          description: 'Inspect the stack trace line numbers and check recent commits touching the affected modules.'
        },
        {
          step: 2,
          title: 'Reproduce locally using identical environment variables',
          description: 'Spin up a local container matching the target environment to inspect stdout and stderr in debug mode.',
          command: 'docker run --rm -it --env-file .env.production <image-tag>'
        },
        {
          step: 3,
          title: 'Enable verbose or debug level logging in the service',
          description: 'Set LOG_LEVEL=debug to capture detailed telemetry before the failure occurs.'
        }
      ],
      preventativeMeasures: [
        'Add comprehensive unit and integration tests covering this code path in CI/CD.',
        'Wrap top-level asynchronous promise handlers with global uncaughtException monitors.'
      ],
      matchedLines: errorLines.slice(0, 5),
      analysisEngine: 'RULE_ENGINE_LOCAL',
      analyzedAt: new Date().toISOString()
    };
  }

  private static generateEmptyResult(): AnalysisResult {
    return {
      signatureId: 'NO_LOGS_PROVIDED',
      ruleName: 'Empty Log Input',
      category: 'APPLICATION',
      severity: 'LOW',
      confidenceScore: 0,
      summary: 'No log content was provided for analysis.',
      rootCause: 'Log stream was empty or contained only whitespace.',
      detectedPattern: 'Empty string',
      affectedComponent: 'Log Ingestion',
      remediationSteps: [
        {
          step: 1,
          title: 'Provide standard output or error logs',
          description: 'Paste container logs, CI/CD runner logs, or select one of the pre-loaded failure scenarios.'
        }
      ],
      preventativeMeasures: [
        'Verify logging configuration (fluentd, datadog, cloudwatch) is correctly forwarding pod stdout.'
      ],
      matchedLines: [],
      analysisEngine: 'RULE_ENGINE_LOCAL',
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Optional LLM integration (Gemini / OpenAI compatible API).
   * If apiKey is absent or the request fails, it gracefully falls back to the deterministic local engine.
   */
  public static async analyzeWithOptionalAI(
    rawLogs: string,
    apiKey?: string
  ): Promise<AnalysisResult> {
    const localResult = this.analyze(rawLogs);

    if (!apiKey || apiKey.trim().length === 0) {
      return localResult;
    }

    try {
      // Call Google Gemini API (gemini-1.5-flash or gemini-2.0-flash)
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      
      const prompt = `You are a Senior Site Reliability Engineer (SRE). Analyze the following deployment failure log and output ONLY a JSON object (no markdown, no backticks) with this exact structure:
{
  "ruleName": "Short descriptive failure title",
  "category": "INFRASTRUCTURE | DATABASE | NETWORK | CONFIGURATION | DEPENDENCY | SECURITY | APPLICATION",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "confidenceScore": number (70-99),
  "summary": "1-2 sentence high-level summary",
  "rootCause": "Deep technical explanation of why this failed",
  "affectedComponent": "Subsystem affected",
  "remediationSteps": [
    { "step": 1, "title": "Step title", "description": "Details", "command": "optional CLI command" }
  ],
  "preventativeMeasures": ["Measure 1", "Measure 2"]
}

LOG CONTENT:
${rawLogs.slice(0, 4000)}
`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        console.warn('Gemini API call failed with status:', response.status, '- falling back to local engine');
        return localResult;
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        return localResult;
      }

      // Clean markdown code blocks if any
      const cleaned = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        signatureId: 'AI_DYNAMIC_ANALYSIS',
        ruleName: parsed.ruleName || localResult.ruleName,
        category: (parsed.category as FailureCategory) || localResult.category,
        severity: (parsed.severity as Severity) || localResult.severity,
        confidenceScore: parsed.confidenceScore || 92,
        summary: parsed.summary || localResult.summary,
        rootCause: parsed.rootCause || localResult.rootCause,
        detectedPattern: 'Gemini LLM Neural Classification',
        affectedComponent: parsed.affectedComponent || localResult.affectedComponent,
        remediationSteps: parsed.remediationSteps || localResult.remediationSteps,
        preventativeMeasures: parsed.preventativeMeasures || localResult.preventativeMeasures,
        matchedLines: localResult.matchedLines,
        analysisEngine: 'GEMINI_AI_ASSIST',
        analyzedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Error during Gemini API analysis, gracefully falling back to rule engine:', err);
      return localResult;
    }
  }
}
