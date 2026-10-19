# Replit / multi-ZIP merge instructions
1. Back up the existing Replit project or import the OTHER ZIP into a clean project first.
2. Unzip this handoff into a temporary directory such as `fsd-handoff/`. Do NOT extract over app source files.
3. Read README.md and catalog/all_files_manifest.csv.
4. Copy selected images from `assets/images/` to your app's public asset folder, keeping original filenames or recording any rename in a mapping file.
5. Import `catalog/wearables.json` as development-only data. Do not treat `status` as purchasable inventory.
6. Review `references/documents/FSD_Website_Product_Variant_Review.csv` for wider apparel product variants and `references/documents/Pasted markdown.md` for source narrative.
7. The pre-existing `references/existing_zips/FSD_Replit_Premium_Website_Mockup.zip` is preserved as an input/reference; it has not been merged or executed.
8. Resolve product-name conflicts and approve pricing/specifications before enabling commerce.
9. Keep staging private/no-index until launch approval. Test responsive layouts and asset loading.
10. Compare SHA-256 hashes in manifest if any files are lost during transfer.

No app source code is overwritten by this archive. No actual deployment has been performed.
