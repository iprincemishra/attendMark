# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
# Keep React Native native bridge calls
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep Hermes internals
-keep class com.facebook.hermes.unicode.** { *; }

# If using react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }

# Keep your custom serializable models/data structures
-keepattributes Signature
-keepattributes *Annotation*
