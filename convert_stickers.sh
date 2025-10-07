#!/bin/bash
SOURCE_DIR="./sticker_source/Zani sticker pack"
DEST_DIR="./stickers"

echo "🎨 Converting Zani's sticker pack..."

# Create all sticker directories
mkdir -p $DEST_DIR/affectionate $DEST_DIR/cute $DEST_DIR/bossy $DEST_DIR/protective $DEST_DIR/professional $DEST_DIR/default

count=0

# Convert all images to webp and organize by mood
find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read file; do
    filename=$(basename "$file" | cut -d. -f1 | tr '[:upper:]' '[:lower:]')
    
    # Determine mood based on filename
    if [[ $filename == *"love"* || $filename == *"lick"* ]]; then
        mood="affectionate"
        newname="love$((RANDOM % 10))"
    elif [[ $filename == *"cute"* || $filename == *"blushing"* || $filename == *"smile"* || $filename == *"zani"* ]]; then
        mood="cute" 
        newname="cute$((RANDOM % 10))"
    elif [[ $filename == *"sassy"* ]]; then
        mood="bossy"
        newname="sassy$((RANDOM % 10))"
    elif [[ $filename == *"work"* ]]; then
        mood="professional"
        newname="work$((RANDOM % 10))"
    elif [[ $filename == *"thinking"* || $filename == *"hmm"* || $filename == *"confused"* || $filename == *"sleepy"* || $filename == *"tea"* || $filename == *"ohh"* || $filename == *"okay"* ]]; then
        mood="default"
        newname="neutral$((RANDOM % 10))"
    else
        mood="default"
        newname="neutral$((RANDOM % 10))"
    fi
    
    # Convert to webp (512x512 is WhatsApp sticker size)
    convert "$file" -resize 512x512 -quality 90 "$DEST_DIR/$mood/${newname}.webp"
    echo "✅ $filename → $mood/${newname}.webp"
    
    ((count++))
done

echo "🎉 Conversion complete! Processed $count stickers."
echo "📁 Stickers are ready in: $DEST_DIR"

# Show final count per mood
echo ""
echo "📊 Sticker distribution:"
for mood in affectionate cute bossy protective professional default; do
    count=$(find "$DEST_DIR/$mood" -name "*.webp" | wc -l)
    echo "  $mood: $count stickers"
done
