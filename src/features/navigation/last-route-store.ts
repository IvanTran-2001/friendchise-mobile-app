import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_ROUTE_KEY = "friendchise.navigation.last-route";

export async function saveLastRoute(pathname: string) {
  await AsyncStorage.setItem(LAST_ROUTE_KEY, pathname);
}

export async function getLastRoute() {
  return AsyncStorage.getItem(LAST_ROUTE_KEY);
}
