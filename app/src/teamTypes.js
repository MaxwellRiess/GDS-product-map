// Team Topologies fundamental team types.
// https://teamtopologies.com/key-concepts
export const TEAM_TYPES = [
  {
    value: 'stream-aligned',
    label: 'Stream-aligned',
    colour: '#ffdd00',
    text: '#0b0c0c',
    description: 'Owns a flow of value to users',
  },
  {
    value: 'platform',
    label: 'Platform',
    colour: '#1d70b8',
    text: '#ffffff',
    description: 'An internal product other teams consume as a service',
  },
  {
    value: 'complicated-subsystem',
    label: 'Complicated subsystem',
    colour: '#f47738',
    text: '#0b0c0c',
    description: 'Needs deep specialist expertise',
  },
  {
    value: 'enabling',
    label: 'Enabling',
    colour: '#4c2c92',
    text: '#ffffff',
    description: 'Helps other teams adopt capabilities',
  },
]

export function teamType(value) {
  return TEAM_TYPES.find(t => t.value === value) || TEAM_TYPES[0]
}

// Total count of components including all nested descendants.
export function countComponents(components) {
  if (!components?.length) return 0
  return components.reduce((n, c) => n + 1 + countComponents(c.components), 0)
}
