import AsyncStorage from "@react-native-async-storage/async-storage";
import events from "../utils/events";


export async function getAsyncInfo({ keyPath }: { keyPath: string }) {
	const saved = await AsyncStorage.getItem(keyPath);
	return saved ? JSON.parse(saved) : null;
}

export async function setAsyncInfo({ keyPath, info }: { keyPath: string, info: any }) {
	await AsyncStorage.setItem(keyPath, JSON.stringify(info));
	events.emit("dayInfoUpdated", keyPath);
}

export async function mergeAsyncInfo({ keyPath, info }: { keyPath: string, info: any }) {
	await AsyncStorage.mergeItem(keyPath, JSON.stringify(info));
	events.emit("dayInfoUpdated", keyPath);
}

export async function removeAsyncInfo({ keyPath }: { keyPath: string }) {
	await AsyncStorage.removeItem(keyPath);
	events.emit("dayInfoUpdated", keyPath);
}