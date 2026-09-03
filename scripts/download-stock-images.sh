#!/bin/bash

# Quick Stock Image Download Script
# This script provides direct links to download free stock images

echo "=========================================="
echo "STOCK IMAGE DOWNLOAD LINKS"
echo "=========================================="
echo ""

echo "🎓 HERO BANNER (Priority 1)"
echo "Download this image for homepage hero:"
echo "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=4800"
echo "Save as: public/hero/efh-hero@3x.jpg"
echo ""

echo "📚 HVAC TECH"
echo "Card: https://images.pexels.com/photos/8486915/pexels-photo-8486915.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Hero: https://images.pexels.com/photos/5691608/pexels-photo-5691608.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Save as: public/images/efh-hvac-card.jpg and efh-hvac-hero.jpg"
echo ""

echo "🔥 WELDING"
echo "Card: https://images.pexels.com/photos/1474993/pexels-photo-1474993.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Hero: https://images.pexels.com/photos/1474993/pexels-photo-1474993.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Save as: public/images/efh-welding-card.jpg and efh-welding-hero.jpg"
echo ""

echo "🚛 CDL/TRUCK DRIVING"
echo "Card: https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Hero: https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Save as: public/images/efh-cdl-card.jpg and efh-cdl-hero.jpg"
echo ""

echo "💉 MEDICAL ASSISTANT"
echo "Card: https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Hero: https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Save as: public/images/efh-medical-assistant-card.jpg and efh-medical-assistant-hero.jpg"
echo ""

echo "💅 NAIL TECHNOLOGY"
echo "Card: https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Hero: https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=1600"
echo "Save as: public/images/efh-nail-tech-card.jpg and efh-nail-tech-hero.jpg"
echo ""

echo "=========================================="
echo "QUICK DOWNLOAD COMMANDS (if wget available)"
echo "=========================================="
echo ""

cat << 'COMMANDS'
# Hero Banner
wget -O public/hero/efh-hero@3x.jpg "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=4800"
convert public/hero/efh-hero@3x.jpg -resize 3200x public/hero/efh-hero@2x.jpg
convert public/hero/efh-hero@3x.jpg -resize 1600x public/hero/efh-hero.jpg

# HVAC
wget -O public/images/efh-hvac-card.jpg "https://images.pexels.com/photos/8486915/pexels-photo-8486915.jpeg?auto=compress&cs=tinysrgb&w=1600"
wget -O public/images/efh-hvac-hero.jpg "https://images.pexels.com/photos/5691608/pexels-photo-5691608.jpeg?auto=compress&cs=tinysrgb&w=1600"

# Welding
wget -O public/images/efh-welding-card.jpg "https://images.pexels.com/photos/1474993/pexels-photo-1474993.jpeg?auto=compress&cs=tinysrgb&w=1600"
wget -O public/images/efh-welding-hero.jpg "https://images.pexels.com/photos/1474993/pexels-photo-1474993.jpeg?auto=compress&cs=tinysrgb&w=1600"

# CDL
wget -O public/images/efh-cdl-card.jpg "https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auto=compress&cs=tinysrgb&w=1600"
wget -O public/images/efh-cdl-hero.jpg "https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=1600"

# Medical Assistant
wget -O public/images/efh-medical-assistant-card.jpg "https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1600"
wget -O public/images/efh-medical-assistant-hero.jpg "https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1600"

# Nail Tech
wget -O public/images/efh-nail-tech-card.jpg "https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=1600"
wget -O public/images/efh-nail-tech-hero.jpg "https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=1600"

echo "✅ All images downloaded!"
COMMANDS

echo ""
echo "=========================================="
echo "OR: Copy/paste these URLs into browser"
echo "Right-click > Save Image As..."
echo "=========================================="
