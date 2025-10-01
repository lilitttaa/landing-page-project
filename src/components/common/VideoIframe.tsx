"use client";

import { useState } from "react";
import clsx from "clsx";
import { CgSpinner } from "react-icons/cg";

type VideoIframeProps = {
  video: string;
};

export const VideoIframe = ({ video }: VideoIframeProps) => {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  return (
    <>
      {!isIframeLoaded && <CgSpinner className="mx-auto size-16 animate-spin text-white" />}
      <iframe
        className={clsx(
          "z-0 mx-auto aspect-video h-full w-full md:w-[738px] lg:w-[940px]",
          {
            visible: isIframeLoaded,
            hidden: !isIframeLoaded,
          },
        )}
        src={video}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsIframeLoaded(true)}
      ></iframe>
    </>
  );
};
