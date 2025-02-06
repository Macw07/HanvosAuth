import os
import shutil
import subprocess

def obfuscate_js(src_dir: str, dest_dir: str) -> None:
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            src_file_path = os.path.join(root, file)
            relative_path = os.path.relpath(src_file_path, src_dir)
            dest_file_path = os.path.join(dest_dir, relative_path)

            # Ensure destination directory exists
            os.makedirs(os.path.dirname(dest_file_path), exist_ok=True)

            # Copy the original file to the destination
            shutil.copy2(src_file_path, dest_file_path)

            if file.endswith('.js'):
                try:
                    command = [
                        'javascript-obfuscator',
                        dest_file_path,
                        '--output', dest_file_path,
                        '--compact', 'true',
                        '--control-flow-flattening', 'true',
                        '--control-flow-flattening-threshold', '0.6',
                        '--dead-code-injection', 'true',
                        '--dead-code-injection-threshold', '0.3',
                        '--debug-protection', 'false',
                        '--disable-console-output', 'true',
                        '--identifier-names-generator', 'hexadecimal',
                        '--log', 'false',
                        '--numbers-to-expressions', 'true',
                        '--rename-globals', 'true',  # Enabled for safer obfuscation
                        '--self-defending', 'false',  # Disabled to reduce runtime errors
                        '--simplify', 'true',
                        '--split-strings', 'true',
                        '--split-strings-chunk-length', '5',
                        '--string-array', 'true',
                        '--string-array-calls-transform', 'true',
                        '--string-array-calls-transform-threshold', '0.5',
                        '--string-array-encoding', 'base64',
                        '--string-array-index-shift', 'true',
                        '--string-array-rotate', 'true',
                        '--string-array-shuffle', 'true',
                        '--string-array-wrappers-count', '1',
                        '--string-array-wrappers-type', 'function',
                        '--string-array-threshold', '0.7',
                        '--unicode-escape-sequence', 'false',  # Avoid compatibility issue
                        '--target', 'browser'
                    ]
                    result = subprocess.run(command, check=True, capture_output=True, text=True)
                    print(f"Obfuscated {dest_file_path}: {result.stdout}")
                except subprocess.CalledProcessError as e:
                    print(f"Error obfuscating {dest_file_path}: {e.stderr}")

            elif file.endswith('.css'):
                try:
                    command = ['cleancss', '-o', dest_file_path, dest_file_path]
                    result = subprocess.run(command, check=True, capture_output=True, text=True)
                    print(f"Minified {dest_file_path}: {result.stdout}")
                except subprocess.CalledProcessError as e:
                    print(f"Error minifying {dest_file_path}: {e.stderr}")

def copy_static_files():
    src_static_dir = '../static'
    dest_static_dir = '../static_prod'

    # Remove and recreate destination directory
    if os.path.exists(dest_static_dir):
        shutil.rmtree(dest_static_dir)
    shutil.copytree(src_static_dir, dest_static_dir)

    # Start obfuscation and minification
    obfuscate_js(src_static_dir, dest_static_dir)

if __name__ == "__main__":
    copy_static_files()
