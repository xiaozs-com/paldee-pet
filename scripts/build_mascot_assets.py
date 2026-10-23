"""Export the two built-in mascot slots from fixed-body Taiji artwork.

Requires FFmpeg with libwebp_anim; no application/runtime dependency is added.
Only the listed eye/hand regions change between frames. The base body, helmet,
headphones and laptop always come from the same first frame of each action.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/mascots/taiji-bot/peek-type-source.png'
OUTPUT = ROOT / 'public/mascots'
LOGO = SOURCE.with_name('laptop-logo-white.png')
FACE_CLEANUP = SOURCE.with_name('type-face-cleanup.png')
ACTIONS = {
    'peek': {'row': 0, 'size': (352, 320), 'duration': [2800, 80, 120, 80],
             'regions': [(114, 210, 80, 84), (250, 210, 80, 84)]},
    'type': {'row': 1, 'size': (856, 812), 'duration': [160, 160, 160, 160],
             'regions': [(96, 232, 116, 78), (235, 248, 116, 62)]},
}


def run(ffmpeg, *args):
    subprocess.run([ffmpeg, '-filter_complex_threads', '1', '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)


def set_frame_durations(path, durations):
    # Set explicit millisecond durations in the animation container. FFmpeg's
    # concat/CFR conversion can otherwise round the first or final hold.
    data = bytearray(path.read_bytes())
    offset = 12
    frame = 0
    while offset + 8 <= len(data):
        size = int.from_bytes(data[offset + 4:offset + 8], 'little')
        if data[offset:offset + 4] == b'ANMF':
            if frame >= len(durations):
                raise ValueError('Unexpected encoded frame count')
            data[offset + 20:offset + 23] = durations[frame].to_bytes(3, 'little')
            frame += 1
        offset += 8 + size + (size & 1)
    if frame != len(durations):
        raise ValueError('Missing encoded animation frame')
    path.write_bytes(data)


def export(ffmpeg):
    width, height = struct.unpack('>II', SOURCE.read_bytes()[16:24])
    cell = min(width // 4, height // 2)
    manifest = {'schemaVersion': 1, 'default': 'peek', 'source': 'taiji-bot/peek-type-source.png',
                'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                'laptopLogo': 'taiji-bot/laptop-logo-white.png',
                'laptopLogoSha256': hashlib.sha256(LOGO.read_bytes()).hexdigest(),
                'faceCleanup': 'taiji-bot/type-face-cleanup.png',
                'faceCleanupSha256': hashlib.sha256(FACE_CLEANUP.read_bytes()).hexdigest(), 'assets': {}}
    cache = ROOT / '.cache/mascot-assets'
    cache.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='export-', dir=cache) as temporary:
        temporary = Path(temporary)
        for name, action in ACTIONS.items():
            out_width, out_height = action['size']
            # Keep the original built-in canvas sizes and transparent padding.
            scaled = round(min(out_width, out_height) * .9)
            fit = f'scale={scaled}:{scaled}:flags=lanczos,pad={out_width}:{out_height}:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba'
            frames = []
            for index, source_index in enumerate((0, 1, 2, 1)):
                frame = temporary / f'{name}-{index}.png'
                y = action['row'] * height // 2
                x = source_index * width // 4
                graph = [f'[0:v]crop={cell}:{cell}:0:{y},format=rgba[base]']
                previous = 'base'
                for region_index, (rx, ry, rw, rh) in enumerate(action['regions']):
                    # Use only eyes/hands from a keyframe; feather the patch edges.
                    alpha = "alpha(X,Y)*min(1,min(min(X,W-1-X),min(Y,H-1-Y))/6)"
                    graph.append(f'[1:v]crop={rw}:{rh}:{x+rx}:{y+ry},format=rgba,geq=r=\'r(X,Y)\':g=\'g(X,Y)\':b=\'b(X,Y)\':a=\'{alpha}\'[patch{region_index}]')
                    current = f'composite{region_index}'
                    graph.append(f'[{previous}][patch{region_index}]overlay={rx}:{ry}:format=auto[{current}]')
                    previous = current
                inputs = ['-i', SOURCE, '-i', SOURCE]
                if name == 'type':
                    inputs.extend(['-i', LOGO])
                    graph.append('[2:v]scale=54:54:flags=lanczos,format=rgba[logo]')
                    graph.append(f'[{previous}][logo]overlay=194:339:format=auto[branded]')
                    previous = 'branded'
                if name == 'type':
                    # Apply only the corrected chin pixels; preserve the original
                    # character, fixed-body motion, and exact laptop branding.
                    inputs.extend(['-i', FACE_CLEANUP])
                    graph.append(f'[{previous}]{fit}[fitted]')
                    alpha = "alpha(X,Y)*min(1,min(min(X,W-1-X),min(Y,H-1-Y))/3)"
                    graph.append(f'[3:v]scale=856:812:flags=lanczos,crop=28:28:378:439,format=rgba,geq=r=\'r(X,Y)\':g=\'g(X,Y)\':b=\'b(X,Y)\':a=\'{alpha}\'[facefix]')
                    graph.append('[fitted][facefix]overlay=378:439:format=auto[out]')
                else:
                    graph.append(f'[{previous}]{fit}[out]')
                run(ffmpeg, *inputs, '-filter_complex', ';'.join(graph),
                    '-map', '[out]', '-frames:v', 1, '-update', 1, frame)
                frames.append(frame)
            shutil.copyfile(frames[0], OUTPUT / f'{name}.png')
            listing = temporary / f'{name}.txt'
            lines = []
            for frame, duration in zip(frames, action['duration']):
                lines.extend([f"file '{frame.as_posix()}'", f'duration {duration / 1000:.3f}'])
            lines.append(f"file '{frames[-1].as_posix()}'")
            listing.write_text('\n'.join(lines) + '\n', encoding='utf-8')
            run(ffmpeg, '-f', 'concat', '-safe', 0, '-i', listing, '-t', sum(action['duration']) / 1000,
                '-fps_mode', 'cfr', '-r', 25, '-c:v', 'libwebp_anim', '-lossless', 1, '-compression_level', 6,
                '-loop', 0, OUTPUT / f'{name}.webp')
            set_frame_durations(OUTPUT / f'{name}.webp', action['duration'])
            assets = {key: action[key] for key in ('row', 'size', 'duration', 'regions')}
            assets.update({'animation': f'{name}.webp', 'poster': f'{name}.png', 'loop': 0,
                           'fixedBody': True, 'sha256': hashlib.sha256((OUTPUT / f'{name}.webp').read_bytes()).hexdigest()})
            manifest['assets'][name] = assets
    (OUTPUT / 'mascot-assets.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Exported peek/type PNG posters and transparent, fixed-body looping WebP animations.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
    args = parser.parse_args()
    if not args.ffmpeg:
        parser.error('FFmpeg with libwebp_anim is required')
    export(args.ffmpeg)
