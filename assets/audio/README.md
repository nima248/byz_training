Audio
-----

Audio files are hosted on Cloudflare R2.

# Audacity recipe
- Set microphone gain to ~50% in sound settings
- Drone track (synthesized): gain 0dB
    - Normalise to -16dB
- Vocal track: gain 0dB
    - Manual limit peaks, makeup gain to -1dB
    - Macro:
        - High-pass 65Hz 12dB
        - Noise gate -22dB
        - Normalize to -1dB
        - Compress
            - Threshold -15dB
            - Makeup gain 0dB
            - Knee width 3.0dB
            - Ratio 3.0
            - Lookahead 3.5ms
            - Attack 0ms
            - Release 150ms
        - Normalise to -3dB
- Mix tracks to mono
- Loudness normalise mix to -19 LUFS
- Export mono standard quality mp3

# Track scripts
- Hold ison with me for 60s
- Simple patterns: Listen, Audiate, Sing, Together, Sing parallagi, Together
    - With ison (60s)
    - Same patterns again without ison (60s)
- Pattern continuation: Sing the other note, or sing the next note (60s)
- Parallagi: Audiate, sing, together (40s)
- Or, hold long notes against drone (40s)
Target time 5 - 6 mins


