import { useTheme } from "@react-navigation/native";
import { BadgeHelp, CheckCircle2, ChevronRight, Eraser, Undo2, CircleAlert } from "lucide-react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { Screen } from "@/router/helpers/types";
import {
  NativeItem,
  NativeList,
  NativeListHeader,
  NativeText
} from "@/components/Global/NativeComponents";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "@/providers/AlertProvider";
import PapillonSpinner from "@/components/Global/PapillonSpinner";
import * as TaskManager from "expo-task-manager";
import { error, log } from "@/utils/logger/logger";
import ButtonCta from "@/components/FirstInstallation/ButtonCta";
import { registerBackgroundTasks, unsetBackgroundFetch } from "@/background/BackgroundTasks";
import { isExpoGo } from "@/utils/native/expoGoAlert";
import { papillonNotify } from "@/background/Notifications";

const DevMenu: Screen<"DevMenu"> = ({ navigation }) => {
  const theme = useTheme();
  const { colors } = theme;
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [isBackgroundActive, setIsBackgroundActive] = useState<null | boolean>(null);

  useEffect(() => {
    const checkBackgroundTaskStatus = async () => {
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync("background-fetch");
        setTimeout(() => {
          setIsBackgroundActive(isRegistered);
        }, 500);
      } catch (err) {
        error(`❌ Failed to register background task: ${err}`, "BACKGROUND");
        setIsBackgroundActive(false);
      }
    };

    if (!isExpoGo() && !loading) {
      checkBackgroundTaskStatus();
    }
  }, [isBackgroundActive, loading]);

  // add button to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => __DEV__ && (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("AccountSelector");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginRight: 0,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: "medium",
              fontSize: 17.5,
            }}
          >
            Appli
          </Text>

          <ChevronRight
            size={32}
            color={colors.primary}
            style={{ marginLeft: 0, marginRight: -8 }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 16,
      }}
    >
      {__DEV__ && (
        <View
          style={{
            backgroundColor: colors.text + "16",
            borderRadius: 10,
            borderCurve: "continuous",
            padding: 16,
            gap: 4,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontFamily: "bold",
            }}
          >
            Menu pour les développeurs
          </Text>


          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              lineHeight: 20,
              fontFamily: "medium",
              opacity: 0.7,
            }}
          >
            Intègre tes options et paramètres de développement ici.
          </Text>
        </View>
      )}

      {__DEV__ && (
        <View>
          <NativeListHeader label="Application debug" />

          <NativeList>

            <NativeItem
              onPress={() => navigation.navigate("AccountSelector")}
            >
              <NativeText>
                Go to Account Selector
              </NativeText>
            </NativeItem>

            <NativeItem
              onPress={() => navigation.navigate("GradeReaction", {
                grade: {
                  id: "devGrade",
                  subjectName: "Développement",
                  description: "Typage avec Vince",
                  timestamp: new Date().getTime(),
                  outOf: { value: 7, status: null },
                  coefficient: 7,
                  student: { value: 7, status: null },
                  average: { value: 7, status: null },
                  max: { value: 7, status: null },
                  min: { value: 1, status: null }
                }
              })}
            >
              <NativeText>
                GradeReaction
              </NativeText>
            </NativeItem>

            <NativeItem
              onPress={() => navigation.navigate("ColorSelector")}
            >
              <NativeText>
                ColorSelector
              </NativeText>
            </NativeItem>

            <NativeItem
              onPress={() => navigation.navigate("AccountCreated")}
            >
              <NativeText>
                AccountCreated
              </NativeText>
            </NativeItem>

          </NativeList>
        </View>
      )}

      <View>
        <NativeListHeader label="Options de développement" />

        <NativeList>
          <NativeItem
            onPress={() => {
              navigation.navigate("SettingStack", {
                view: "SettingsFlags"
              });
            }}
          >
            <NativeText
            >
              Gérer les flags
            </NativeText>
          </NativeItem>
          <NativeItem
            onPress={() => {
              navigation.navigate("SettingStack", {
                view: "SettingsDevLogs"
              });
            }}
          >
            <NativeText
            >
              Logs de l'application
            </NativeText>
          </NativeItem>
          {!isExpoGo() && (
            <>
              <NativeItem
                icon={
                  isBackgroundActive ? (
                    <CheckCircle2 />
                  ) : isBackgroundActive === false ? (
                    <CircleAlert />
                  ) : (
                    <PapillonSpinner />
                  )
                }
              >
                <NativeText variant="body">
                  {isBackgroundActive === true
                    ? "Le background est actuellement actif."
                    : isBackgroundActive === false
                      ? "Le background n'est pas actif."
                      : "Vérification du background..."}
                </NativeText>
                {isBackgroundActive !== null && (
                  <ButtonCta
                    value={isBackgroundActive ? "Réinitialiser" : "Activer"}
                    primary={true}
                    style={{
                      marginTop: 14,
                      minWidth: null,
                      maxWidth: null,
                      width: "85%",
                      alignSelf: "center",
                    }}
                    onPress={async () => {
                      setLoading(true);
                      setIsBackgroundActive(null);
                      if (isBackgroundActive) {
                        await unsetBackgroundFetch()
                          .then(() => log("✅ Background task unregistered", "BACKGROUND"))
                          .catch((ERRfatal) =>
                            error(
                              `❌ Failed to unregister background task: ${ERRfatal}`,
                              "BACKGROUND"
                            )
                          );;
                      }

                      await registerBackgroundTasks()
                        .then(() => log("✅ Background task registered", "BACKGROUND"))
                        .catch((ERRfatal) =>
                          error(
                            `❌ Failed to register background task: ${ERRfatal}`,
                            "BACKGROUND"
                          )
                        );
                      setTimeout(() => {
                        setLoading(false);
                      }, 500);
                    }}
                  />
                )}
              </NativeItem>
              <ButtonCta
                value="Test des notifications"
                icon={
                  loading ? (
                    <View>
                      <PapillonSpinner
                        strokeWidth={3}
                        size={22}
                        color={theme.colors.text}
                      />
                    </View>
                  ) : undefined
                }
                disabled={loading}
                primary={!loading}
                style={{
                  marginTop: 14,
                  minWidth: null,
                  maxWidth: null,
                  width: "75%",
                  alignSelf: "center",
                }}
                onPress={async () => {
                  setLoading(true);
                  await papillonNotify(
                    {
                      id: "test",
                      title: "Coucou, c'est Papillon 👋",
                      subtitle: "Test",
                      body: "Si tu me vois, c'est que tout fonctionne correctement !",
                    },
                    "Test"
                  );
                  setTimeout(() => {
                    setLoading(false);
                  }, 500);
                }}
              />
            </>
          )}
        </NativeList>
      </View>

      <View>
        <NativeListHeader label="Actions destructives" />

        <NativeList>

          <NativeItem
            onPress={() => {
              showAlert({
                title: "Réinitialisation de Papillon",
                message: "Es-tu sûr de vouloir réinitialiser toutes les données de l'application ?",
                icon: <BadgeHelp />,
                actions: [
                  {
                    title: "Annuler",
                    icon: <Undo2 />,
                    primary: false,
                  },
                  {
                    title: "Réinitialiser",
                    icon: <Eraser />,
                    onPress: () => {
                      AsyncStorage.clear();
                      navigation.popToTop();
                    },
                    danger: true,
                    delayDisable: 10,
                  }
                ]
              });
            }}
          >
            <NativeText
              style={{
                color: "#E91E63",
                fontFamily: "semibold",
              }}
            >
              Réinitialiser toutes les données
            </NativeText>
            <NativeText variant="subtitle">
              Supprime toutes les données de l'application
            </NativeText>
          </NativeItem>
        </NativeList>
      </View>

    </ScrollView>
  );
};

export default DevMenu;
