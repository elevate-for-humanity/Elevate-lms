# Private working-directory channel. Never write control records to user output.
unset BASH_ENV
__studio_shell_pid=$BASHPID
__studio_report_directory() {
  if [[ "$BASHPID" == "$__studio_shell_pid" ]]; then printf '%s\0' "$PWD" >&3; fi
}
cd() { builtin cd "$@"; local result=$?; if [[ "$result" == 0 ]]; then __studio_report_directory; fi; return "$result"; }
pushd() { builtin pushd "$@"; local result=$?; if [[ "$result" == 0 ]]; then __studio_report_directory; fi; return "$result"; }
popd() { builtin popd "$@"; local result=$?; if [[ "$result" == 0 ]]; then __studio_report_directory; fi; return "$result"; }
__studio_report_directory
