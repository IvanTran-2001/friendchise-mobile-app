import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Keyboard,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, spacing } from "../../src/lib/theme";
import { SearchField } from "./search-field";

type CollapsibleSearchDockProps = {
  search: string;
  onChangeSearch: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  children: (props: { onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }) => ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  searchDockStyle?: StyleProp<ViewStyle>;
  searchShellStyle?: StyleProp<ViewStyle>;
  hideOffset?: number;
  animationDuration?: number;
};

/**
 * Floating search bar that hides on downward scroll and reappears on upward scroll.
 * Wrap it around the screen content and provide the scrollable child as a render prop.
 * Consumers should add top padding to their scroll content for the absolutely positioned dock,
 * such as `paddingTop: 72` in the current task and tools screens.
 */
export function CollapsibleSearchDock({
  search,
  onChangeSearch,
  placeholder,
  disabled,
  children,
  containerStyle,
  searchDockStyle,
  searchShellStyle,
  hideOffset = 64,
  animationDuration = 180,
}: CollapsibleSearchDockProps) {
  const [searchTranslateY] = useState(() => new Animated.Value(0));
  const [searchOpacity] = useState(() => new Animated.Value(1));
  const [searchVisible, setSearchVisible] = useState(true);
  const lastScrollY = useRef(0);
  const searchVisibleRef = useRef(true);
  const inputRef = useRef<TextInput>(null);

  const showSearchBar = useCallback(() => {
    if (searchVisibleRef.current) {
      return;
    }

    searchVisibleRef.current = true;
    setSearchVisible(true);
    Animated.parallel([
      Animated.timing(searchTranslateY, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(searchOpacity, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationDuration, searchOpacity, searchTranslateY]);

  const hideSearchBar = useCallback(() => {
    if (!searchVisibleRef.current) {
      return;
    }

    inputRef.current?.blur();
    Keyboard.dismiss();
    searchVisibleRef.current = false;
    setSearchVisible(false);
    Animated.parallel([
      Animated.timing(searchTranslateY, {
        toValue: -hideOffset,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(searchOpacity, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationDuration, hideOffset, searchOpacity, searchTranslateY]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const deltaY = currentY - lastScrollY.current;

    if (currentY <= 8) {
      showSearchBar();
    } else if (deltaY > 8) {
      hideSearchBar();
    } else if (deltaY < -8) {
      showSearchBar();
    }

    lastScrollY.current = currentY;
  }, [hideSearchBar, showSearchBar]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.searchDock, searchDockStyle]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.searchShell,
            searchShellStyle,
            {
              transform: [{ translateY: searchTranslateY }],
              opacity: searchOpacity,
            },
          ]}
          pointerEvents={searchVisible ? "auto" : "none"}
          accessibilityElementsHidden={!searchVisible}
          importantForAccessibility={searchVisible ? "auto" : "no-hide-descendants"}
        >
          <SearchField ref={inputRef} value={search} onChangeText={onChangeSearch} placeholder={placeholder} disabled={disabled} />
        </Animated.View>
      </View>

      {children({ onScroll: handleScroll })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchDock: {
    position: "absolute",
    top: spacing.sm + 2,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    elevation: 3,
  },
  searchShell: {
    borderRadius: radius.lg,
  },
});