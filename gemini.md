# Gemini Agent Development Guidelines (GEMINI.md)

This document provides guidelines and best practices for developing and integrating Gemini-powered agents within this project's Agent Development Kit (ADK). It aims to ensure consistency, maximize agent effectiveness, and leverage the strengths of the Gemini family of models, drawing inspiration from the successful architecture of existing Claude agents.

## 1. Gemini Agent Principles

Gemini agents developed within this framework should adhere to the following principles, mirroring the robust design seen in the Claude implementation:

*   **Tool-Augmented Intelligence:** Gemini agents must be designed to effectively utilize external tools. Just as Claude agents use `execute_code`, `search_code`, and other capabilities, Gemini agents should integrate with project-specific and general-purpose tools to interact with the environment, execute actions, and gather information.
*   **Clear Goals and Focused Tasks:** Each Gemini agent should have a well-defined purpose and a focused set of responsibilities. Avoid creating overly complex, monolithic agents; instead, compose smaller, specialized agents for intricate workflows.
*   **Memory Management:** Agents should effectively manage both short-term (context window) and long-term memory (e.g., via vector databases or persistent storage) to maintain context, learn from interactions, and retrieve relevant information.
*   **Planning and Orchestration:** For complex tasks, agents should employ a planning engine to break down problems into smaller, manageable steps. Orchestration patterns (e.g., sequential, parallel, hierarchical) should be used for multi-agent collaboration.
*   **Extensibility and Modularity:** Design Gemini agents and their components to be modular and easily extensible. New tools, models, or agent behaviors should be integrated seamlessly without requiring significant refactoring of existing systems.

## 2. Integration with the ADK

To integrate a Gemini LLM into the existing ADK, follow the established pattern for LLM clients:

*   **Create a `Gemini` Class:** Develop a `Gemini` class that inherits from `BaseLlm` (and potentially `AgentClient` if it defines a direct inference interface). This class will encapsulate the logic for interacting with the Google Gemini API (or Vertex AI Gemini endpoints).
*   **Implement `generate_content_async` (or `inference`):** This method will handle the asynchronous (or synchronous) call to the Gemini API, process requests, and format responses according to the ADK's internal standards.
*   **Handle Message Formatting:** Ensure that input messages are correctly formatted for the Gemini API, including managing roles (e.g., `user`, `model`) and handling multi-modal inputs (text, images, video) if the agent is designed for them.
*   **Register in `LLMRegistry`:** Once developed, the `Gemini` class should be registered in the project's `LLMRegistry` to make it discoverable and usable by other parts of the ADK.

## 3. Prompting Best Practices for Gemini

When crafting prompts for Gemini agents:

*   **Be Explicit and Detailed:** Provide clear instructions, examples (few-shot prompting), and constraints to guide the agent's behavior and output format.
*   **Leverage Multi-modality:** If the agent design requires it, integrate image, audio, or video inputs into prompts to take advantage of Gemini's multi-modal capabilities.
*   **Define Output Format:** Specify desired output formats (e.g., JSON, Markdown) to facilitate downstream processing.
*   **System Instructions:** Use a system instruction for general behavioral guidelines, persona, and core rules.

## 4. Evaluation and Safety

*   **Rigorous Evaluation:** All Gemini agents must undergo thorough evaluation using predefined metrics and test sets. Implement continuous evaluation to monitor performance and identify regressions.
*   **Security by Design:** When integrating tools or allowing code execution, prioritize safety. Utilize sandboxed environments (e.g., Docker for code execution) and implement guardrails to prevent unintended actions or security vulnerabilities.

## 5. My Role as Your Gemini CLI Agent

As your Gemini CLI agent, I will adhere to these `GEMINI.md` guidelines in all tasks related to Gemini agent development. I will:

*   **Propose Solutions:** Suggest architectural and implementation approaches that align with these principles.
*   **Write and Refactor Code:** Create new Gemini agent components, update existing ones, and refactor code to improve adherence to these guidelines.
*   **Utilize My Tools:** Leverage my `run_shell_command`, `read_file`, `write_file`, `replace`, and `google_web_search` capabilities to help you build, debug, and enhance your Gemini agents within the ADK framework.
*   **Promote Best Practices:** Remind you of these guidelines when relevant to ensure consistency and quality in Gemini agent development.