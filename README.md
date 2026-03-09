byz_training

Host audio files for use on training.byzison.xyz

# Audacity recipe
- Drone track: gain -15dB
    - Full amplitude waveform
- Vocal track: gain -3dB
    - Macro:
        - Normalize to -3dB
        - Compress
            - Threshold -18dB
            - Makeup gain 0dB
            - Knee width 3.0dB
            - Ratio 3.0
            - Lookahead 3.5ms
            - Attack 5.0ms
            - Release 150ms
        - Normalise to -1dB

