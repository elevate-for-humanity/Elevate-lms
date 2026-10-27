# Renderer source and segment checkpoint correction

Live evidence at 20:21 UTC: cosmetology lesson 1's finished-media check failed with a 10.60-second freeze and one repeated moving sequence. The builder correctly returned to lesson_film_render, but another retry alone could not guarantee different pixels.

Line-by-line image/source audit found two boundaries missing from the prior fix:

- Dockerfile.ultimate-worker copied lib/video and the builder, but not remotion-src. The worker therefore inherited the immutable base image's React compositions, despite newer source in main.
- Saved segment fingerprints included scene data and layoutVersion 4, but no renderer producer version. A renderer correction could still read segments produced under an older composition contract.

The worker now copies current remotion-src and compiles that exact entry point during image construction. The temporary test bundle is removed in the same Docker layer; this is not media or learner approval. A shared producer version now participates in lesson render evidence, the saved segment key, and the render result metadata. Changing the producer invalidates rendering/downstream evidence while preserving earlier instructional checkpoints. Unrelated releases do not automatically invalidate segments.

Validation: three fingerprint/image-boundary tests and six monitor tests pass; thirteen focused versioned-contract/course-integration tests pass. Admin TypeScript validation passes. The actual production image compilation and subsequent rendered-video quality inspection remain separate release requirements.

Do not force a second worker against a live lease, reset attempt counters, lower the four-second freeze limit, erase old evidence, or claim a corrected video passed before the actual quality gate records it.
