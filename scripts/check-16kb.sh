#!/usr/bin/env bash
# Checks that an APK runs on 16 KB page-size devices (required by Google Play and Samsung Galaxy Store):
# every native library must be stored uncompressed on a 16 KB boundary, and its ELF LOAD segments
# must be aligned to at least 16 KB (2**14).
set -euo pipefail
apk="$1"
zipalign="$(ls "$ANDROID_HOME"/build-tools/*/zipalign | sort -V | tail -1)"
"$zipalign" -c -P 16 -v 4 "$apk" > /dev/null || { echo "::error::$apk: native libraries are not 16 KB aligned in the zip"; exit 1; }
work="$(mktemp -d)"
unzip -q "$apk" 'lib/*.so' -d "$work" 2>/dev/null || { echo "No native libraries: nothing else to check."; exit 0; }
bad=0
while IFS= read -r so; do
  for align in $(objdump -p "$so" | awk '/LOAD/ { print $NF }'); do
    exp="${align#2**}"
    if [ "$exp" -lt 14 ]; then echo "::error::${so#"$work"/}: LOAD segment aligned to $align (needs 2**14)"; bad=1; fi
  done
done < <(find "$work" -name '*.so')
[ "$bad" -eq 0 ] && echo "All native libraries are 16 KB aligned."
exit "$bad"
