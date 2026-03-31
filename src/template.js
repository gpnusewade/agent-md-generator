function generateTemplate(answers) {
  const {
    name,
    description,
    role,
    capabilities,
    constraints,
    workflow,
    tools,
    outputFormat
  } = answers;

  let md = `# ${name}\n\n`;

  if (description) {
    md += `${description}\n\n`;
  }

  md += `## Role & Identity\n\n${role}\n\n`;

  md += `## Capabilities\n\n`;
  capabilities.forEach((cap, index) => {
    md += `${index + 1}. ${cap}\n`;
  });
  md += '\n';

  md += `## Constraints\n\n`;
  constraints.forEach((con, index) => {
    md += `${index + 1}. ${con}\n`;
  });
  md += '\n';

  md += `## Workflow\n\n${workflow}\n\n`;

  if (tools && tools.length > 0) {
    md += `## Tools\n\n`;
    tools.forEach((tool, index) => {
      md += `${index + 1}. ${tool}\n`;
    });
    md += '\n';
  }

  md += `## Output Format\n\n${outputFormat}\n`;

  return md;
}

module.exports = { generateTemplate };
