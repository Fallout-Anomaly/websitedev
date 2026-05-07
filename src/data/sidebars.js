/**
 * Fallen World - Guide sidebar
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'main/intro',
    'main/requirements',
    'main/setup',
    'main/launching',
    {
      type: 'category',
      label: 'Gameplay guide',
      collapsed: true,
      items: [
        {type: 'doc', id: 'main/gameplay/index', label: 'Gameplay guide'},
        'main/gameplay/survival',
        'main/gameplay/combat',
        'main/gameplay/controls',
        'main/gameplay/tips',
      ],
    },
    {
      type: 'category',
      label: 'FAQ & Troubleshooting',
      collapsed: true,
      items: [
        {type: 'doc', id: 'main/faq', label: 'FAQ & Troubleshooting'},
        'main/faq/general',
        'main/faq/technical',
        'main/faq/audio',
        'main/faq/installation',
        'main/faq/known-issues',
      ],
    },
    'main/donations',
  ],
};

export default sidebars;
