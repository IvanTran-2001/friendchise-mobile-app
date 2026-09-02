import { Image, StyleSheet, View } from "react-native";
import { colors } from "../../../src/lib/theme";

const logoSource = require("../../../public/LOGO.png");

type LogoMarkProps = {
  size: number;
};

export function LogoMark({ size }: LogoMarkProps) {
  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Image
        source={logoSource}
        resizeMode="cover"
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    overflow: "hidden",
  },
  image: {
    backgroundColor: colors.surface,
  },
});