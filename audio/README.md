Audio
-----

Audio files are hosted on Cloudflare R2.

# Audacity recipe
- Drone track (synthesized): gain -15dB
    - Normalise to -1dB
- Vocal track: gain -3dB
    - Normalize to -1dB
    - Compress
        - Threshold -18dB
        - Makeup gain 0dB
        - Knee width 3.0dB
        - Ratio 3.0
        - Lookahead 3.5ms
        - Attack 5.0ms
        - Release 150ms
    - Normalise to -1dB
- Mix tracks to mono
- Normalise mix to -3dB
- Export mono standard quality mp3
