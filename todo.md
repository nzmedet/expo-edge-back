Expo edge back
A package that simulates "Nothing Phone 3" edge swiping to go back

(should work wit expo and bare react-native)

- expo-haptics (drag/release feedback)
- react-native-gesture-handler (edge drag)
- react-native-reanimated (the anchor movement and morf)
- react-native-svg (morf the SVG when anchor moves)
(install packages if missing)

Features
- fully typescript
- optional configurable edge width to drag
- optional custom svg image for anchor(a component that should receive sharedValue) (current icon is located in ./assets dir)
- optional screen dimming or scaling down mid drag animation
- should not break existing drag or scroll controls in the app

Additional
- mainly focuses on iphone, but still works on android if edge-back doesnt exist in android (lower sdk version?)
- if setup with react-navigation or expo-router - should maybe ask user to disable enableGestures on navigation? but the right edge of the screen is still available to use, so might not be necessary to disable enableGestures
- example app, showcasing the demo
- not sure if tests are necessary, but if its possible to test then add the tests too
- fill in the readme

