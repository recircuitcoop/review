# TOKF

Use the installed TOKF hook for supported CLI output; otherwise use `tokf run <command>`. Never double-prefix.

`🗜️` marks compressed output; `🗜️#N` identifies recoverable output. Use `tokf raw N` and recover only the relevant portion when exact content is needed. A compressed diff summary does not prove its hunks were reviewed.

A pipeline reports its last stage's exit status. Treat TOKF's explicit underlying-command failure as failure even if a later pipeline stage succeeds.

If the default tracking database is unwritable in the sandbox, set `TOKF_DB_PATH=/tmp/review-tokf.db` consistently for both execution and recovery. Do not change global configuration merely to work around a project sandbox.
