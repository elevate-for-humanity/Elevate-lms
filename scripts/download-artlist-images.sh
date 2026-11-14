#!/bin/bash

# Download Artlist images for the website

echo "📥 Downloading Artlist images..."

# Create directory if it doesn't exist
mkdir -p public/images/artlist

# Array of images to download
declare -A IMAGES=(
  ["hero-training-1.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__1/generated-image-27f393c1-9c9c-4da2-9abb-4392179328a8.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=mwJLETKH9A~Ubzidg53GMK8DO9OQuyoCwmRkNf6wj-ERRJIZR73rHETStL-3smBqNmZBCvUeMcSNUj0aclIe2x~xrXJQKn02UlXxJRskab2Tjf4xOEu92jnHAENDkpeLfbDDM6ElRSNxistLEUbOq-G1kTy9iSZvK~ktQztpC3CVs~7qGAwO~PrCocsLz6EjakU0VyGoo0WlWxDeRnN19levGPnB1NRLREXztRCPtbe5VBtpt3ptE85VH~SWaTdInzXl1RcXlfjp4W0Dy~92N3JnmHdn1LOAJWRH9sD3QHZj0a0HknRvbrjp7CpTi7BqS7Vj~yIgnhA~2uRry7L-VQ__"
  ["hero-training-2.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__5/generated-image-10364d06-2007-4b9d-8872-10b2adfa4878.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=zYoWpQ~nmOyNcPy0JrphAesBEq6SozqkjXGzSpchH4aFrvLIyO0kJPP7j0wZEStLkdxK3re7WdBJfr3g7YCSmlmBbdvrX-YfPMJIiCd378lMPYpo281dJBNYEQff2xMAQrMCHl4G4~6GD0xoaio-PMkgVQmYdlCJfskHL2Gq5nwNTHtRa~2nB~uruXJheQ2HaP56kBNI87lKpOwnKao-0OCrN45KLnrGzwu2ABFCLQPaCHv0xW1E3cvhdMEvUyOPcykOmzYA~ZflIbgteI7lWoMBS14QeHQ91bLB0S7EgTC-yt6nrvsPZGs-ztMT9uH7UtSBqDIj38TtX7K4shYLbw__"
  ["hero-training-3.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__1/generated-image-0d87762d-6309-4b06-ac66-0d8aa87d6502.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=IKdtAAT6oUZ6MTjCtNu7ceR5hxcA-RDo5okJIcLGMechm0YNntQzYfS-fKv-2aLLw75wlGvlSZ1BqV8AZUczNgzMxuShqF0m4l8Xx4z2iKYiqcSPGXeRbev9bjt7vwfZOGIE-dSGIiiXT65~koyrfNFLLVYse-XeNUlb4OxH16C7E-SkU0Kj5Z1~ceXIUUgtsPVN8~FQTGkG6XHhHn6qVPBA6sOhZZjvglqCJtU9hCpIf2NInd0mIc0ceyXiXCo2evBqClZ0R~3rFrCCR2zdCZ52kczsCFKxp-mWVSyrGpU0C9pPkYsxigfNvZkfSEH6gAItM3044mlSzJKTOxwoTw__"
  ["hero-training-4.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__6/generated-image-1ddebf31-516b-4bb1-aae2-7131ab58173b.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=SmsV8hVfMaZEdXWztufJcovwStv24n4x-p38PRFVWJfHL1Trd9s4OlfrykAXQs7lKIyNGSTgW8qnLaChIqHZwy33jvChF6eqwQEF51xYf79~tWP10QlmY2P1y4ZOv7~hRQVnspaEsAYegh3Rtuq6zstPda2ylpgJsSTz1fU90UQ2~nWmgdM7EWqwHWuT3CW3I~WKtdO-Fo-WZek7sOg0omg8i32EF0nEXSi4ny0OtBfsMFFDHQv7TdgOnizzqO4FJXq956yyDLQwGbvz2A2F0zlBDopUf8BFfQubCAlQK-5TU2X0H~37jLDng2abdacVXc4JhL4TRA8UC5fwqXxLJg__"
  ["hero-training-5.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__9/generated-image-d44bfbc9-ce5b-4632-982f-538685fc6155.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=narHp5muNyZWds9A~83HjGOOhA7sm8CrxI8RrrYgIitzcYltrXOx2dIjN7b0Z-IHz2xJzTizrcg84Gzd1Lo7ehCXIfnNtnh38yJB9q2hq2Yx3qwY8sektq8-B8cfVWadjP66tamLg~80hO3Fw5gKQAvKHYNkGiHjwN464IRw5KnkJHo6l~jb9baMAPkKBxwCl9pjvl6ny9eqAoijZhnJr0pxAqPZSN-mXoFZHf87N~gARs5B5ZtTTXncbao28imNX78zuC~a61-jp9wvpk3Lv07fyVc025~NbimrzURdjscjK~Furxdug4VHRlCXp4WKGCltnmhfiB788gJdm9Oa5A__"
  ["hero-training-6.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__2/generated-image-1eaf9212-8bed-42b2-8e38-50239eea88b4.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=xkwRWVn5dCh0GYOaczC1XoPXJr8-JK4GOV~FgC8EpE10K1atxuBiRmBMZ-hX6oX7p4ShFKhPqiHkAKGp~BTHdF3OV~Onyn752ZH-Zo9D9pvyQnOpTanzMlic4aIqXZE-Q~L7Cj~slidAURm6P9g9RS2l3LLeL2sZ4bXZDbOqVF7WWhZq02okI286ohJiuveSzosp~rpiLXKmnPJThxtG-9lXvI5-cW5JwD24GmBvmcxDaQ89jNc9ZFadKHoe1bUyoOkk60ftpAmFGMB4W-8z5km59pwVhtyZBAlyIv8VltZZVp3-5xdOT1MPQj6P-PKNFnjx5ImjCXCPcNkvM7j7JA__"
  ["hero-training-7.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__8/generated-image-fd26c7db-9212-43a2-b57c-1aca66d2805d.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=s3NRTgAAbw5l41A3-hZKrO2lkzLWl1hlCia7~M~6im13owPALzuqlyuQ0a8UjRg9BHMpjwaQSj4ooncyCnmvyZdcdMlaKLp7PloLMjKgo8VnYQMe-HcwkhaspjSyYKbEsFs9v4WldukX2Tn5erA6UEHovLS~4GKj2~j~tOQ~BkU90sGJxGHP9kmqvNTN3HuNOpwpoRlVFBZA-NV4lbrfunvoXyOc9HEM2RN~CGJFlmMBlVAz-mNo-5WW3X336-fDxXxEVCYF~zWGMOxmyG8wLRXEGbWGopo58Ry0m3BzyYGe3NiINyJq3sKaVhgkrTsA7jycZ79uhZdfKDD0xDvP4g__"
  ["hero-training-8.jpg"]="https://cms-artifacts.artlist.io/content/generated-image-v1/image__8/generated-image-4dd1e5ee-ba27-4479-a6ac-ac7b5f057dda.jpg?Expires=2079530289&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=aPR6lwWn4dSoGGr~sFCbYLmcGlqaEekzz7hl6faMRU098H~aHKS5UKNOL2V2U1IhKTImiO4ANTnDDeMgQbDWAY6Nm5pCOyS8tsdlUWN52nyirDt6EBJmxBd8MkAcEVJ0tdmJaacBzbjvhNjkdQ~6-9hWMtYta~Ta0THCVWPKXViiM6EurS1QQanQ~fWoSNeN3EjrJcEzeH~CNeUAblpBBvIPmeaNhbOs5YT9OJhN-8Xai0HByRzNSv2N3dk21jEV17QkSWFRb1MHtEcZsYLyOs3AirhRLkOZmrOJYhPP9985nYnKSL3MibSECKBkvugryj~e05wJfMXTot2AdvH9LQ__"
)

# Download each image
for filename in "${!IMAGES[@]}"; do
  url="${IMAGES[$filename]}"
  echo ""
  echo "📥 Downloading $filename..."
  
  curl -L "$url" -o "public/images/artlist/$filename"
  
  if [ -f "public/images/artlist/$filename" ]; then
    SIZE=$(du -h "public/images/artlist/$filename" | cut -f1)
    echo "✅ Downloaded: $filename ($SIZE)"
  else
    echo "❌ Failed to download: $filename"
  fi
done

echo ""
echo "🎉 All images downloaded!"
echo "📍 Location: public/images/artlist/"
echo ""
echo "Available images:"
ls -lh public/images/artlist/
