---
sidebar_position: 2
title: Requirements & setup
hide_title: true
sidebar_label: Requirements & setup
---

import TerminalCard from '@site/src/components/TerminalCard';
import StatCard from '@site/src/components/StatCard';
import useBaseUrl from '@docusaurus/useBaseUrl';

# Requirements & setup


<div style={{marginBottom: '2rem'}}>
<TerminalCard title="Video Installation Guide">

Prefer a video tutorial? Watch the full installation process here:

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%'}}>
  <iframe 
    src="https://www.youtube.com/embed/HrzANxCwUx0" 
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
    title="Fallen World Installation Guide" 
    frameBorder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowFullScreen
  ></iframe>
</div>

</TerminalCard>
</div>

<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <img src={useBaseUrl('/img/anomaly-guide/LauncherIntro.png')} alt="Launcher Intro" style={{borderRadius: '8px', border: '1px solid var(--anomaly-border)', maxWidth: '100%'}} />
</div>

## The ultimate all-in-one experience

Fallen World is designed to offer a truly streamlined installation. Forget days of manual patching—our custom launcher handles the heavy lifting for you.

To get started, simply:
1.  **Check your hardware:** Ensure you meet the requirements below.
2.  **Disable Overlays:** Manually disable Steam, Discord, and any other overlays. [Watch this guide](https://www.youtube.com/watch?v=7e_kY6LmQ0Y) for exact steps.
3.  **Run the launcher:** Launch our custom tool to begin the installation.

:::tip Simplified Installation
Unlike other modlists that require hours of preparation, Fallen World only requires you to set your game to English, remove the HD textures, and set Steam updates to "Only update this game when I launch it."
:::

## Hardware requirements

<div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
  <StatCard value="Modern CPU" label="CPU (3GHz+)" />
  <StatCard value="16GB / 32GB" label="RAM (Min / Ideal)" />
  <StatCard value="6GB / 8GB" label="GPU VRAM" />
  <StatCard value="350GB SSD" label="HDD NOT SUPPORTED" variant="red" />
</div>

## Game Configuration

Before starting the installation, you must ensure your game is correctly configured in Steam to avoid installation failures.

<div style={{marginBottom: '2rem'}}>
<TerminalCard title="Set Language to English">

Fallen World requires the **English** version of Fallout 4. If your game is set to another language, Wabbajack will fail to hash the files.

1. Right-click **Fallout 4** in your Steam Library.
2. Select **Properties** > **Language**.
3. Ensure **English** is selected.

![Steam Language Configuration](/img/anomaly-guide/EnglishVoice.png)

</TerminalCard>
</div>

<div style={{marginBottom: '2rem'}}>
<TerminalCard title="Remove High Resolution Texture Pack">

The official Bethesda High Resolution Texture Pack **must** be removed so Wabbajack can correctly hash your files and compile the modlist. Failure to do this will cause installation errors.

1. Go to the **Fallout 4** page in your Steam Library.
2. Scroll down to the **DLC** section.
3. Uncheck/Uninstall the **High Resolution Texture Pack**.

Refer to the video below for exact steps:

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--anomaly-border)'}}>
  <iframe 
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    src="https://www.youtube.com/embed/ECqUe0DqrNI" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen>
  </iframe>
</div>

</TerminalCard>
</div>

<div style={{marginBottom: '2rem'}}>
<TerminalCard title="Steam Update Settings">

To prevent Steam from automatically updating and breaking your installation, you must change the update behavior.

1. Right-click **Fallout 4** in your Steam Library.
2. Select **Properties** > **Updates**.
3. Under **Automatic Updates**, select **"Only update this game when I launch it."**

</TerminalCard>
</div>

